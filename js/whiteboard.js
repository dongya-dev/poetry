// ========================================
// 诗中画·画中情 — 协作白板模块
// 基于 Fabric.js 6.x + Socket.IO
// ========================================

const Whiteboard = {
  canvas: null,
  fabricCanvas: null,
  roomId: '',
  username: '',
  role: 'student',
  socket: null,
  tool: 'select',     // select | line | text | sticky | delete
  lineColor: '#2D5A27',
  isLocked: false,
  isDrawing: false,
  drawStart: null,
  drawLine: null,

  /**
   * 初始化协作白板
   * @param {string} canvasElId - Canvas容器元素ID
   * @param {string} roomId - 协作房间ID (group_1/2/3 或 teacher_board)
   * @param {object} options - { role: 'student'|'teacher', username: '...', presetNodes: [], readonly: false }
   */
  init(canvasElId, roomId, options = {}) {
    this.roomId = roomId;
    this.username = options.username || '匿名用户';
    this.role = options.role || 'student';
    const readonly = options.readonly || false;

    const container = document.getElementById(canvasElId);
    if (!container) {
      console.warn('[Whiteboard] 找不到容器:', canvasElId);
      return;
    }

    // 如果已有 canvas，先销毁
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
    }

    // 获取容器尺寸
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    // 检查 Fabric.js 是否加载
    if (typeof fabric === 'undefined') {
      console.warn('[Whiteboard] Fabric.js 未加载，使用回退模式');
      this._initFallback(container, width, height, options);
      return;
    }

    // 创建 Fabric.js 画布
    this.fabricCanvas = new fabric.Canvas(canvasElId, {
      width: width,
      height: height,
      backgroundColor: '#FAF7F0',
      selection: !readonly && !this.isLocked,
    });
    this.canvas = container;

    // 如果有预设节点，先绘制
    if (options.presetNodes && options.presetNodes.length > 0) {
      this._renderPresetNodes(options.presetNodes);
    }

    if (readonly) {
      this._disableEditing();
      return;
    }

    // 绑定事件
    this._bindCanvasEvents();

    // 连接 Socket.IO
    this._connectSocket();

    console.log(`[Whiteboard] 初始化完成: 房间=${roomId}, 用户=${this.username}`);
  },

  /**
   * 连接 Socket.IO
   */
  _connectSocket() {
    if (typeof io === 'undefined') {
      console.warn('[Whiteboard] Socket.IO 未加载，无法启用协作功能');
      return;
    }

    // 连接 Socket.IO 服务器（由 config.js 定义后端地址）
    const socketUrl = typeof API_BASE !== 'undefined' ? API_BASE : '';
    this.socket = io(socketUrl);

    this.socket.on('connect', () => {
      console.log('[Whiteboard] Socket.IO 已连接');
      this.socket.emit('join_room', {
        room: this.roomId,
        username: this.username,
        role: this.role,
      });
    });

    // 接收初始画布状态
    this.socket.on('canvas_init', (data) => {
      console.log('[Whiteboard] 收到初始画布状态:', data.objects.length, '个对象');
      this._applyRemoteObjects(data.objects);
      if (data.locked) {
        this.isLocked = true;
        this._disableEditing();
      }
    });

    // 接收画布更新
    this.socket.on('canvas_update', (data) => {
      this._handleRemoteUpdate(data);
    });

    // 用户加入/离开
    this.socket.on('user_joined', (data) => {
      this._showToast(`${data.username} 加入了协作`);
      this._updateUserList(data.users);
    });

    this.socket.on('user_left', (data) => {
      this._showToast(`${data.username} 离开了协作`);
      this._updateUserList(data.users);
    });

    // 画布清空
    this.socket.on('canvas_cleared', (data) => {
      if (this.fabricCanvas) {
        this.fabricCanvas.clear();
        this.fabricCanvas.backgroundColor = '#FAF7F0';
      }
      this._showToast(`${data.username} 清空了画布`);
    });

    // 锁定/解锁
    this.socket.on('canvas_lock_changed', (data) => {
      this.isLocked = data.locked;
      if (data.locked) {
        this._disableEditing();
        this._showToast('教师已锁定画布');
      } else {
        this._enableEditing();
        this._showToast('教师已解锁画布');
      }
    });

    this.socket.on('error_msg', (data) => {
      this._showToast(data.message, 'warning');
    });

    this.socket.on('disconnect', () => {
      console.log('[Whiteboard] Socket.IO 已断开');
    });
  },

  /**
   * 绑定 Fabric.js 画布事件
   */
  _bindCanvasEvents() {
    if (!this.fabricCanvas) return;

    const self = this;

    this.fabricCanvas.on('object:modified', (e) => {
      if (!e.target || !e.target._whiteboardId) return;
      self._syncToServer('modify', self._serializeObject(e.target));
    });

    this.fabricCanvas.on('object:moving', (e) => {
      if (!e.target || !e.target._whiteboardId) return;
      // 移动时发送（节流由 Socket.IO 自行处理）
    });

    // 鼠标按下：开始绘图（连线/自由绘制）
    this.fabricCanvas.on('mouse:down', (opt) => {
      if (self.tool === 'line' && !self.isDrawing) {
        self.isDrawing = true;
        const ptr = self.fabricCanvas.getPointer(opt.e);
        self.drawStart = { x: ptr.x, y: ptr.y };

        self.drawLine = new fabric.Line(
          [ptr.x, ptr.y, ptr.x, ptr.y],
          {
            stroke: self.lineColor,
            strokeWidth: 2,
            selectable: false,
            evented: false,
          }
        );
        self.fabricCanvas.add(self.drawLine);
      }
    });

    // 鼠标移动：更新连线预览
    this.fabricCanvas.on('mouse:move', (opt) => {
      if (self.isDrawing && self.drawLine) {
        const ptr = self.fabricCanvas.getPointer(opt.e);
        self.drawLine.set({ x2: ptr.x, y2: ptr.y });
        self.fabricCanvas.renderAll();
      }
    });

    // 鼠标松开：完成连线
    this.fabricCanvas.on('mouse:up', () => {
      if (self.isDrawing && self.drawLine) {
        self.isDrawing = false;
        // 给连线赋予唯一 ID
        const id = 'line_' + Date.now();
        self.drawLine.set({
          _whiteboardId: id,
          selectable: true,
          evented: true,
        });
        self._syncToServer('add', self._serializeObject(self.drawLine));
        self.drawLine = null;
        self.drawStart = null;
      }
    });
  },

  /**
   * 设置工具栏
   */
  setToolbar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const self = this;
    const tools = [
      { id: 'select', label: '🖐 选择', tool: 'select' },
      { id: 'line', label: '🔗 连线', tool: 'line' },
      { id: 'text', label: '✏️ 文字', tool: 'text' },
      { id: 'sticky', label: '📝 便签', tool: 'sticky' },
      { id: 'delete', label: '🗑 删除', tool: 'delete' },
    ];

    const colors = ['#2D5A27', '#D4A853', '#3B82F6', '#DC2626', '#8B5CF6', '#000000'];

    container.innerHTML = `
      <div class="whiteboard-toolbar">
        <div class="tool-group">
          ${tools.map(t => `
            <button class="wb-tool-btn ${t.tool === self.tool ? 'active' : ''}"
                    data-tool="${t.tool}" title="${t.label}">
              ${t.label}
            </button>
          `).join('')}
        </div>
        <div class="tool-group color-picker-group">
          <span style="font-size:12px;color:var(--text-secondary);margin-right:6px">颜色:</span>
          ${colors.map(c => `
            <button class="wb-color-btn ${c === self.lineColor ? 'active' : ''}"
                    data-color="${c}"
                    style="background:${c};width:22px;height:22px;border-radius:50%;border:2px solid ${c === self.lineColor ? '#333' : 'transparent'};cursor:pointer">
            </button>
          `).join('')}
        </div>
        <div class="tool-group">
          <button class="wb-tool-btn wb-action-btn" data-action="add-node" title="添加意象节点">➕ 意象</button>
          <button class="wb-tool-btn wb-action-btn" data-action="add-sticky" title="添加便签">📝 便签</button>
          ${this.role === 'teacher' ? `
            <button class="wb-tool-btn wb-action-btn" data-action="lock" title="锁定画布">🔒 锁定</button>
            <button class="wb-tool-btn wb-action-btn wb-danger" data-action="clear" title="清空画布">🗑 清空</button>
          ` : ''}
        </div>
        <div class="tool-group" id="wbUserList" style="margin-left:auto;font-size:12px;color:var(--text-secondary)">
          👤 协作中: ${this.username}
        </div>
      </div>
    `;

    // 绑定工具按钮事件
    container.querySelectorAll('.wb-tool-btn[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = btn.dataset.tool;
        self.setTool(tool);
        container.querySelectorAll('.wb-tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // 绑定颜色按钮
    container.querySelectorAll('.wb-color-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        self.lineColor = btn.dataset.color;
        container.querySelectorAll('.wb-color-btn').forEach(b => {
          b.classList.remove('active');
          b.style.borderColor = 'transparent';
        });
        btn.classList.add('active');
        btn.style.borderColor = '#333';
      });
    });

    // 绑定操作按钮
    container.querySelectorAll('.wb-action-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'add-node') self._promptAddNode();
        else if (action === 'add-sticky') self._promptAddSticky();
        else if (action === 'lock') self._toggleLock();
        else if (action === 'clear') self._clearCanvas();
      });
    });
  },

  /**
   * 切换工具
   */
  setTool(tool) {
    this.tool = tool;

    if (!this.fabricCanvas) return;

    if (tool === 'delete') {
      // 删除模式下，点击对象即删除
      const self = this;
      this.fabricCanvas.on('mouse:down', function deleteHandler(opt) {
        if (self.tool !== 'delete') {
          self.fabricCanvas.off('mouse:down', deleteHandler);
          return;
        }
        if (opt.target) {
          const obj = opt.target;
          if (obj._whiteboardId) {
            self._syncToServer('delete', { id: obj._whiteboardId });
          }
          self.fabricCanvas.remove(obj);
        }
      });
    }

    // 点击空白处添加文字
    if (tool === 'text') {
      const self = this;
      this.fabricCanvas.on('mouse:down', function textHandler(opt) {
        if (self.tool !== 'text') {
          self.fabricCanvas.off('mouse:down', textHandler);
          return;
        }
        if (!opt.target) {
          const ptr = self.fabricCanvas.getPointer(opt.e);
          self._addTextAt(ptr.x, ptr.y);
        }
      });
    }
  },

  /**
   * 在指定位置添加文字
   */
  _addTextAt(x, y) {
    if (!this.fabricCanvas || this.isLocked) return;

    const id = 'text_' + Date.now();
    const text = new fabric.IText('双击编辑文字', {
      left: x,
      top: y,
      fontSize: 16,
      fill: this.lineColor,
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      _whiteboardId: id,
    });

    this.fabricCanvas.add(text);
    this.fabricCanvas.setActiveObject(text);
    this._syncToServer('add', this._serializeObject(text));
  },

  /**
   * 添加意象节点
   */
  addImageryNode(name, emoji, x, y, color) {
    if (!this.fabricCanvas || this.isLocked) return;

    const id = 'node_' + Date.now();
    const nodeColor = color || this.lineColor;
    const cx = x || 120 + Math.random() * 400;
    const cy = y || 100 + Math.random() * 300;

    // 创建圆形背景
    const circle = new fabric.Circle({
      left: cx,
      top: cy,
      radius: 30,
      fill: 'rgba(45,90,39,0.08)',
      stroke: nodeColor,
      strokeWidth: 2,
      _whiteboardId: id + '_bg',
      selectable: false,
      evented: false,
    });

    // 创建文字
    const text = new fabric.Text(emoji + ' ' + name, {
      left: cx - 25,
      top: cy - 10,
      fontSize: 14,
      fill: nodeColor,
      fontWeight: 'bold',
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      _whiteboardId: id,
      _isNode: true,
      _nodeName: name,
    });

    // 分组
    const group = new fabric.Group([circle, text], {
      left: cx - 30,
      top: cy - 30,
      _whiteboardId: id,
      _isNode: true,
      _nodeName: name,
      subTargetCheck: true,
    });

    this.fabricCanvas.add(group);
    this._syncToServer('add', this._serializeObject(group));
    return group;
  },

  /**
   * 添加便签
   */
  addSticky(x, y, text) {
    if (!this.fabricCanvas || this.isLocked) return;

    const id = 'sticky_' + Date.now();
    const cx = x || 100 + Math.random() * 400;
    const cy = y || 80 + Math.random() * 300;

    const sticky = new fabric.Rect({
      left: cx,
      top: cy,
      width: 160,
      height: 80,
      fill: '#FFF9E6',
      stroke: '#D4A853',
      strokeWidth: 1,
      rx: 4,
      ry: 4,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 8, offsetX: 2, offsetY: 2 }),
      _whiteboardId: id,
    });

    const stickyText = new fabric.Textbox(text || '输入内容...', {
      left: cx + 8,
      top: cy + 8,
      width: 144,
      fontSize: 13,
      fill: '#333',
      fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
      editable: true,
    });

    const group = new fabric.Group([sticky, stickyText], {
      _whiteboardId: id,
      subTargetCheck: true,
    });

    this.fabricCanvas.add(group);
    this._syncToServer('add', this._serializeObject(group));
    return group;
  },

  /**
   * 序列化 Fabric 对象
   */
  _serializeObject(obj) {
    if (!obj) return {};
    return {
      id: obj._whiteboardId || '',
      type: obj.type || 'unknown',
      left: obj.left,
      top: obj.top,
      width: obj.width,
      height: obj.height,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      scaleX: obj.scaleX,
      scaleY: obj.scaleY,
      angle: obj.angle,
      opacity: obj.opacity,
      text: obj.text || '',
      fontSize: obj.fontSize,
      _isNode: obj._isNode || false,
      _nodeName: obj._nodeName || '',
      // 对于 Group，还需序列化子对象
      _objects: obj._objects ? obj._objects.map(o => ({
        type: o.type,
        fill: o.fill,
        stroke: o.stroke,
        text: o.text,
        fontSize: o.fontSize,
        radius: o.radius,
        width: o.width,
        height: o.height,
      })) : [],
    };
  },

  /**
   * 同步到服务器
   */
  _syncToServer(action, obj) {
    if (!this.socket || !this.socket.connected) return;

    this.socket.emit('canvas_sync', {
      room: this.roomId,
      action: action,
      object: obj,
      username: this.username,
    });
  },

  /**
   * 处理远程更新
   */
  _handleRemoteUpdate(data) {
    if (!this.fabricCanvas) return;

    const { action, object: obj } = data;

    switch (action) {
      case 'add':
        if (obj._isNode) {
          this.addImageryNode(obj._nodeName || '意象', '', obj.left + 30, obj.top + 30, obj.stroke);
        } else if (obj.type === 'rect') {
          this.addSticky(obj.left, obj.top, obj.text);
        } else if (obj.type === 'line') {
          this._addRemoteLine(obj);
        } else if (obj.type === 'i-text' || obj.type === 'text') {
          this._addTextAt(obj.left, obj.top);
        }
        break;

      case 'modify':
        this._updateRemoteObject(obj);
        break;

      case 'delete':
        this._deleteRemoteObject(obj);
        break;

      case 'move':
        this._moveRemoteObject(obj);
        break;

      case 'clear':
        if (this.fabricCanvas) {
          this.fabricCanvas.clear();
          this.fabricCanvas.backgroundColor = '#FAF7F0';
        }
        break;
    }

    this.fabricCanvas.renderAll();
  },

  _addRemoteLine(obj) {
    if (!this.fabricCanvas) return;
    const line = new fabric.Line([obj.x1 || 0, obj.y1 || 0, obj.x2 || 100, obj.y2 || 100], {
      stroke: obj.stroke || this.lineColor,
      strokeWidth: obj.strokeWidth || 2,
      _whiteboardId: obj.id,
    });
    this.fabricCanvas.add(line);
  },

  _updateRemoteObject(obj) {
    if (!this.fabricCanvas) return;
    const target = this._findObjectById(obj.id);
    if (target) {
      target.set({
        left: obj.left, top: obj.top,
        fill: obj.fill, stroke: obj.stroke,
        opacity: obj.opacity, angle: obj.angle,
      });
      if (obj.text && target.type === 'i-text') {
        target.set('text', obj.text);
      }
      target.setCoords();
    }
  },

  _deleteRemoteObject(obj) {
    if (!this.fabricCanvas) return;
    const target = this._findObjectById(obj.id);
    if (target) {
      this.fabricCanvas.remove(target);
    }
  },

  _moveRemoteObject(obj) {
    if (!this.fabricCanvas) return;
    const target = this._findObjectById(obj.id);
    if (target) {
      target.set({ left: obj.left, top: obj.top });
      target.setCoords();
    }
  },

  _findObjectById(id) {
    if (!this.fabricCanvas) return null;
    const objects = this.fabricCanvas.getObjects();
    return objects.find(o => o._whiteboardId === id) || null;
  },

  /**
   * 应用远程对象的完整列表（用于新加入者同步）
   */
  _applyRemoteObjects(objects) {
    if (!this.fabricCanvas || !objects) return;
    this.fabricCanvas.clear();
    this.fabricCanvas.backgroundColor = '#FAF7F0';

    for (const obj of objects) {
      if (obj._isNode) {
        this._createNodeFromData(obj);
      } else if (obj.type === 'line') {
        this._addRemoteLine(obj);
      } else if (obj.type === 'i-text' || obj.type === 'text') {
        this._createTextFromData(obj);
      } else if (obj.type === 'group') {
        // 尝试重建 group
        try {
          this._createGroupFromData(obj);
        } catch (e) {
          // 忽略无法重建的对象
        }
      }
    }
    this.fabricCanvas.renderAll();
  },

  _createNodeFromData(obj) {
    if (!this.fabricCanvas) return;
    const circle = new fabric.Circle({
      left: 0, top: 0, radius: 30,
      fill: 'rgba(45,90,39,0.08)',
      stroke: obj.stroke || '#2D5A27',
      strokeWidth: 2,
      selectable: false, evented: false,
    });
    const text = new fabric.Text('📜 ' + (obj._nodeName || ''), {
      left: 0, top: 0, fontSize: 14,
      fill: obj.stroke || '#2D5A27',
      fontWeight: 'bold',
    });
    const group = new fabric.Group([circle, text], {
      left: obj.left || 100, top: obj.top || 100,
      _whiteboardId: obj.id, _isNode: true,
      _nodeName: obj._nodeName,
      subTargetCheck: true,
    });
    this.fabricCanvas.add(group);
  },

  _createTextFromData(obj) {
    if (!this.fabricCanvas) return;
    const text = new fabric.IText(obj.text || '文字', {
      left: obj.left || 100, top: obj.top || 100,
      fontSize: obj.fontSize || 16,
      fill: obj.fill || '#333',
      _whiteboardId: obj.id,
    });
    this.fabricCanvas.add(text);
  },

  _createGroupFromData(obj) {
    // 简化处理：仅还原矩形+文本的组合
    if (!this.fabricCanvas || !obj._objects) return;
    if (obj._objects.length >= 2 && obj._objects[0].type === 'rect') {
      const rect = new fabric.Rect({
        width: obj._objects[0].width || 160,
        height: obj._objects[0].height || 80,
        fill: obj._objects[0].fill || '#FFF9E6',
        stroke: obj._objects[0].stroke || '#D4A853',
        strokeWidth: 1, rx: 4, ry: 4,
      });
      const tb = new fabric.Textbox(obj.text || '', {
        left: 8, top: 8,
        width: (obj._objects[0].width || 160) - 16,
        fontSize: 13,
      });
      const group = new fabric.Group([rect, tb], {
        left: obj.left, top: obj.top,
        _whiteboardId: obj.id,
        subTargetCheck: true,
      });
      this.fabricCanvas.add(group);
    }
  },

  /**
   * 渲染预设节点（用于意象情感地图）
   */
  _renderPresetNodes(nodes) {
    if (!this.fabricCanvas) return;
    nodes.forEach((node, i) => {
      this.addImageryNode(node.name, node.emoji || '📜', node.x, node.y, node.color);
    });
  },

  /**
   * 禁用编辑
   */
  _disableEditing() {
    if (this.fabricCanvas) {
      this.fabricCanvas.selection = false;
      this.fabricCanvas.forEachObject(o => {
        o.selectable = false;
        o.evented = false;
      });
      this.fabricCanvas.renderAll();
    }
  },

  /**
   * 启用编辑
   */
  _enableEditing() {
    if (this.fabricCanvas) {
      this.fabricCanvas.selection = true;
      this.fabricCanvas.forEachObject(o => {
        o.selectable = true;
        o.evented = true;
      });
      this.fabricCanvas.renderAll();
    }
  },

  /**
   * 提示添加意象节点
   */
  _promptAddNode() {
    const name = prompt('请输入意象名称（如：月、柳、雁）：', '月');
    if (!name) return;
    const emojiMap = {
      '月': '🌙', '柳': '🌿', '雁': '🕊️', '酒': '🍶', '梅': '🌸',
      '落花': '🥀', '长亭': '🏛️', '孤舟': '⛵', '竹': '🎋', '菊': '🏵️',
      '夕阳': '🌅', '雨': '🌧️',
    };
    const emoji = emojiMap[name] || '📜';
    this.addImageryNode(name, emoji, undefined, undefined, this.lineColor);
    this._showToast(`已添加意象节点: ${emoji} ${name}`);
  },

  /**
   * 提示添加便签
   */
  _promptAddSticky() {
    const text = prompt('请输入便签内容：', '小组讨论...');
    if (text !== null) {
      this.addSticky(undefined, undefined, text || '小组讨论...');
      this._showToast('已添加便签');
    }
  },

  /**
   * 切换锁定状态（教师）
   */
  _toggleLock() {
    if (this.role !== 'teacher') return;
    const newLocked = !this.isLocked;
    if (this.socket && this.socket.connected) {
      this.socket.emit('lock_canvas', { room: this.roomId, locked: newLocked });
    }
  },

  /**
   * 清空画布（教师）
   */
  _clearCanvas() {
    if (this.role !== 'teacher') return;
    if (!confirm('确定要清空画布吗？此操作不可撤销！')) return;
    if (this.socket && this.socket.connected) {
      this.socket.emit('clear_canvas', { room: this.roomId, username: this.username });
    }
    if (this.fabricCanvas) {
      this.fabricCanvas.clear();
      this.fabricCanvas.backgroundColor = '#FAF7F0';
    }
  },

  /**
   * 更新用户列表
   */
  _updateUserList(users) {
    const el = document.getElementById('wbUserList');
    if (el) {
      el.innerHTML = `👤 协作中: ${(users || []).join(', ')}`;
    }
  },

  /**
   * 显示提示信息
   */
  _showToast(msg, type = 'info') {
    // 在画布上方显示临时提示
    const toast = document.createElement('div');
    toast.className = `wb-toast wb-toast-${type}`;
    toast.textContent = msg;
    toast.style.cssText = `
      position:absolute;top:10px;right:10px;z-index:200;
      padding:8px 16px;border-radius:8px;font-size:13px;
      background:${type === 'warning' ? '#FEF3C7' : '#E0F2FE'};
      color:${type === 'warning' ? '#92400E' : '#1E40AF'};
      animation:fadeInOut 2.5s ease forwards;
      pointer-events:none;
    `;
    if (this.canvas) {
      this.canvas.style.position = this.canvas.style.position || 'relative';
      this.canvas.appendChild(toast);
      setTimeout(() => toast.remove(), 2600);
    }
  },

  /**
   * 回退模式：无 Fabric.js 时的简版白板
   */
  _initFallback(container, width, height, options) {
    const nodes = options.presetNodes || [];
    container.innerHTML = `
      <div class="wb-fallback" style="width:${width}px;height:${height}px;background:#FAF7F0;border-radius:12px;position:relative;overflow:hidden">
        <svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none">
          ${nodes.length > 1 ? nodes.slice(1).map((n, i) => {
            const cx = nodes[0].x || 250, cy = nodes[0].y || 200;
            const dx = n.x - cx, dy = n.y - cy;
            const dist = Math.sqrt(dx*dx+dy*dy) || 1;
            const nx = dx/dist, ny = dy/dist;
            return `<line x1="${cx+nx*40}" y1="${cy+ny*40}" x2="${n.x-nx*30}" y2="${n.y-ny*30}" stroke="${n.color||'#2D5A27'}" stroke-width="2" stroke-dasharray="6,3" opacity="0.4"/>`;
          }).join('') : ''}
        </svg>
        ${nodes.map((n, i) => `
          <div class="wb-fallback-node" style="
            position:absolute;left:${n.x-40}px;top:${n.y-30}px;
            padding:8px 14px;border-radius:20px;
            background:white;border:2px solid ${n.color||'#2D5A27'};
            color:${n.color||'#2D5A27'};font-weight:600;font-size:14px;
            box-shadow:0 2px 8px rgba(0,0,0,0.06);cursor:grab;
            display:flex;align-items:center;gap:6px;
          " draggable="true">
            ${n.emoji||'📜'} ${n.name}
          </div>
        `).join('')}
        <div style="position:absolute;bottom:12px;right:16px;font-size:11px;color:#999">
          回退模式 · 拖拽节点调整布局 · 安装 Fabric.js 启用完整协作
        </div>
      </div>
    `;

    // 简单拖拽
    container.querySelectorAll('.wb-fallback-node').forEach(el => {
      let dragging = false, offsetX = 0, offsetY = 0;
      el.addEventListener('mousedown', (e) => {
        dragging = true;
        offsetX = e.clientX - el.offsetLeft;
        offsetY = e.clientY - el.offsetTop;
        el.style.cursor = 'grabbing';
      });
      document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        el.style.left = (e.clientX - offsetX) + 'px';
        el.style.top = (e.clientY - offsetY) + 'px';
      });
      document.addEventListener('mouseup', () => {
        dragging = false;
        el.style.cursor = 'grab';
      });
    });
  },

  /**
   * 销毁白板
   */
  destroy() {
    if (this.socket) {
      this.socket.emit('leave_room', { room: this.roomId, username: this.username });
      this.socket.disconnect();
      this.socket = null;
    }
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
    this.canvas = null;
  },
};
