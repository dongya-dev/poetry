// ========================================
// 诗中画·画中情 — 混合式教学平台 主逻辑
// ========================================

// 后端 API 地址（由 config.js 定义，本地开发时可设为空字符串使用相对路径）
const API = typeof API_BASE !== 'undefined' ? API_BASE : '';

// ========== DeepSeek AI 代理层 ==========
const DeepSeekAPI = {
  async analyzePoem(poem, author, task = 'full') {
    try {
      const res = await fetch(API + '/api/analyze-poem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poem, author, task })
      });
      const data = await res.json();
      if (data.success) return data;
      console.warn('[DeepSeek] analyzePoem failed:', data);
      return null;
    } catch (e) {
      console.warn('[DeepSeek] analyzePoem error:', e.message);
      return null;
    }
  },

  async scoreAnswer(studentAnswer, reference, question) {
    try {
      const res = await fetch(API + '/api/score-answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_answer: studentAnswer, reference, question })
      });
      const data = await res.json();
      return data; // always return, server回退给8分
    } catch (e) {
      console.warn('[DeepSeek] scoreAnswer error:', e.message);
      return { success: false, score: 8, feedback: '评分服务暂不可用，已给参与分8分。' };
    }
  },
};

// ========== Vika API 代理层 ==========
const VikaAPI = {
  BASE: API + '/api/vika',

  async fetchTable(table) {
    try {
      const res = await fetch(`${this.BASE}/${table}`);
      const data = await res.json();
      if (data.success) return data.data;
      console.warn('[VikaAPI] fetch failed:', data);
      return null;
    } catch (e) {
      console.warn('[VikaAPI] fetch error:', e.message);
      return null;
    }
  },

  async createRecord(table, fields) {
    try {
      const res = await fetch(`${this.BASE}/${table}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (data.success) return data;
      console.warn('[VikaAPI] create failed:', data);
      return null;
    } catch (e) {
      console.warn('[VikaAPI] create error:', e.message);
      return null;
    }
  },

  async recordScore(student, module, type, score, detail) {
    return await fetch(API + '/api/submit-record', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student, module, type, score, detail })
    }).then(r => r.json()).catch(e => null);
  },

  async submitMoment(student, imagery, content, verses, symbolism, question) {
    return await fetch(API + '/api/submit-moment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student, imagery, content, verses, symbolism, question })
    }).then(r => r.json()).catch(e => null);
  },

  async submitGallery(student, poem, author, content, prompt, appreciation) {
    return await fetch(API + '/api/submit-gallery', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student, poem, author, content, prompt, appreciation })
    }).then(r => r.json()).catch(e => null);
  },
};

const App = {
  currentUser: USERS.teacher,
  currentPage: 'dashboard',
  challengeState: { level: 1, currentItem: 0, score: 0, answered: false, matching: {} },
  posterStep: 1,
  posterData: { poem: null, analysis: {}, prompt: '', imageUrl: null, appreciation: '' },
  sceneData: null,

  init() {
    this.bindNav();
    this.renderPage('dashboard');
  },

  // ========== 导航 ==========
  bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.currentPage = page;
        this.renderPage(page);
      });
    });
  },

  // ========== 渲染页面 ==========
  renderPage(page) {
    const main = document.getElementById('mainContent');
    switch(page) {
      case 'dashboard': this.renderDashboard(main); break;
      case 'evaluation': this.renderDashboard(main); break;  // 已合并入仪表盘
      case 'micro-video': this.renderMicroVideo(main); break;
      case 'moments': this.renderMoments(main); break;
      case 'resource-lib': this.renderResourceLib(main); break;
      case 'challenge': this.renderChallenge(main); break;
      case 'mindmap': this.renderMindmap(main); break;
      case 'practice': this.renderPractice(main); break;
      case 'homework': this.renderHomework(main); break;
      case 'poster': this.renderPoster(main); break;
      case 'ai-scene': this.renderAIScene(main); break;
      case 'gallery': this.renderGallery(main); break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ==========================================
  // 1. 教师仪表盘
  // ==========================================
  renderDashboard(main) {
    const totalStudents = USERS.students.length;
    const momentsCount = MOMENTS_DATA.length;
    const resourceCount = IMAGERIES.reduce((sum, i) => sum + i.poems.length, 0);
    const galleryCount = GALLERY_WORKS.length;

    main.innerHTML = `
      <div class="page-header">
        <h2>📊 教学仪表盘</h2>
        <p>欢迎回来，${USERS.teacher.name}！以下是课程数据概览</p>
      </div>

      <div class="grid-4">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.1)">👩‍🎓</div>
          <div><div class="stat-value">${totalStudents}</div><div class="stat-label">学生总数</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(16,185,129,0.1)">✅</div>
          <div><div class="stat-value">${totalStudents}</div><div class="stat-label">课前任务完成</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.1)">📝</div>
          <div><div class="stat-value">${momentsCount}</div><div class="stat-label">朋友圈帖子</div></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(139,92,246,0.1)">🎨</div>
          <div><div class="stat-value">${galleryCount}</div><div class="stat-label">AI海报作品</div></div>
        </div>
      </div>

      <div class="grid-2" style="margin-top:24px">
        <div class="card">
          <div class="card-title">📚 意象资源库概览</div>
          <table class="table">
            <thead><tr><th>意象</th><th>关联诗词数</th><th>覆盖情感类型</th></tr></thead>
            <tbody>
              ${IMAGERIES.map(img => `
                <tr>
                  <td><strong>${img.emoji} ${img.name}</strong></td>
                  <td>${img.poems.length}首</td>
                  <td>${[...new Set(img.poems.map(p => p.emotion))].join('、')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-title">📋 课程评价维度</div>
          <table class="table">
            <thead><tr><th>评价维度</th><th>内容</th><th>权重</th></tr></thead>
            <tbody>
              ${EVALUATION_RUBRIC.map(e => `
                <tr>
                  <td><strong>${e.dimension}</strong></td>
                  <td>${e.content}</td>
                  <td><span class="tag tag-accent">${e.weight}%</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="card-title">⏱️ 教学过程时间线</div>
        <div style="display:flex;gap:16px;overflow-x:auto;padding:8px 0">
          ${[
            { phase: '课前线上', time: '15-20分钟', color: '#3B82F6', tasks: '微视频导学 → 古人的朋友圈 → 意象资源库' },
            { phase: '环节一', time: '7分钟', color: '#10B981', tasks: '从意象到意境 · 概念建构' },
            { phase: '环节二', time: '15分钟', color: '#F59E0B', tasks: '意象组合挑战赛 · 游戏化练习' },
            { phase: '环节三', time: '15分钟', color: '#8B5CF6', tasks: '意象情感地图 · 合作探究' },
            { phase: '环节四', time: '8分钟', color: '#EF4444', tasks: '诗歌鉴赏实战 · 迁移应用' },
            { phase: '课后线上', time: '30分钟', color: '#EC4899', tasks: '情感辨析练习 → AI诗词海报' },
          ].map(p => `
            <div style="min-width:180px;padding:16px;background:white;border-radius:12px;border-left:4px solid ${p.color};box-shadow:0 2px 8px rgba(0,0,0,0.04)">
              <div style="font-weight:700;font-size:15px;margin-bottom:4px">${p.phase}</div>
              <div style="font-size:12px;color:${p.color};font-weight:600;margin-bottom:8px">⏱ ${p.time}</div>
              <div style="font-size:12px;color:#6B7280;line-height:1.6">${p.tasks}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 课程评价（嵌入仪表盘） -->
      <div class="grid-2" style="margin-top:20px">
        <div class="card">
          <div class="card-title">📊 评价量表</div>
          <table class="table">
            <thead><tr><th>评价维度</th><th>评价内容</th><th>权重</th><th>评分标准</th></tr></thead>
            <tbody>
              ${EVALUATION_RUBRIC.map(e => `
                <tr>
                  <td><strong>${e.dimension}</strong></td>
                  <td>${e.content}</td>
                  <td><span class="tag tag-accent">${e.weight}%</span></td>
                  <td>优秀(90-100) / 良好(80-89) / 合格(60-79) / 待提高(&lt;60)</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="card" style="overflow-x:auto">
          <div class="card-title">👩‍🎓 学生成绩总览</div>
          <table class="table">
            <thead><tr><th>学生</th><th>小组</th>${EVALUATION_RUBRIC.map(e => `<th>${e.dimension}<br><small>${e.weight}%</small></th>`).join('')}<th>总分</th></tr></thead>
            <tbody>
              ${USERS.students.map(s => {
                const scores = EVALUATION_RUBRIC.map(() => Math.floor(75 + Math.random() * 25));
                const total = scores.reduce((sum, sc, i) => sum + sc * EVALUATION_RUBRIC[i].weight / 100, 0);
                return `
                  <tr>
                    <td><strong>${s.avatar} ${s.name}</strong></td>
                    <td>${s.group}</td>
                    ${scores.map(sc => `<td style="text-align:center">${sc}</td>`).join('')}
                    <td><span class="tag tag-primary" style="font-size:14px">${total.toFixed(1)}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // ==========================================
  // 2. 微视频导学
  // ==========================================
  renderMicroVideo(main) {
    this.videoChapter = 0;
    const chapters = [
      {
        title: '第一讲：什么是意象？',
        duration: '1分30秒',
        content: `
          <div style="font-size:16px;line-height:2">
            <p><strong>意象</strong> = <span style="color:var(--primary);font-weight:700">意</span>（主观情意）+ <span style="color:var(--accent);font-weight:700">象</span>（客观物象）</p>
            <p>诗人将自己的<strong>情感、思想</strong>寄托于具体的<strong>景物、事物</strong>之上，使客观物象成为主观情意的载体。</p>
            <div style="background:var(--bg);padding:16px;border-radius:10px;margin:12px 0">
              <p style="font-style:italic;margin-bottom:8px">🌙 例："举头望明月，低头思故乡。"</p>
              <p>"明月"是<strong>象</strong>，"思乡"是<strong>意</strong>——诗人看到月亮，想起了家乡。</p>
            </div>
            <p>同一物象在不同诗人笔下，可以承载<strong>完全不同的情感</strong>——这正是意象的魅力所在。</p>
          </div>
        `
      },
      {
        title: '第二讲：常见意象分类',
        duration: '1分30秒',
        content: `
          <div style="font-size:16px;line-height:2">
            <p>古典诗词中形成了<strong>相对稳定</strong>的意象系统：</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">
              ${[
                ['🌙 月', '思乡、团圆、思念'],
                ['🌿 柳', '送别、挽留、惜别'],
                ['🕊️ 雁', '思乡、漂泊、音信'],
                ['🍶 酒', '豪迈、解愁、旷达'],
                ['🌸 梅', '坚贞、高洁、傲骨'],
                ['🎋 竹', '不屈、高洁、隐逸'],
                ['🏵️ 菊', '隐逸、高洁、愁思'],
                ['🌅 夕阳', '时光流逝、壮阔、思乡'],
              ].map(([name, meaning]) => `
                <div style="background:var(--bg);padding:10px 14px;border-radius:8px;display:flex;align-items:center;gap:8px">
                  <span style="font-size:18px">${name.split(' ')[0]}</span>
                  <div><strong>${name.split(' ')[1]}</strong><br><small style="color:var(--text-secondary)">${meaning}</small></div>
                </div>
              `).join('')}
            </div>
          </div>
        `
      },
      {
        title: '第三讲：意象 → 意境',
        duration: '1分15秒',
        content: `
          <div style="font-size:16px;line-height:2">
            <p><strong>意象</strong>是单个的、具体的；<strong>意境</strong>是整体的、综合的。</p>
            <div style="background:var(--bg);padding:16px;border-radius:10px;margin:12px 0">
              <p style="font-weight:700;margin-bottom:8px">《天净沙·秋思》：</p>
              <p>意象：枯藤、老树、昏鸦、小桥、流水、人家、古道、西风、瘦马、夕阳</p>
              <p style="margin-top:8px"><strong>↓ 组合 ↓</strong></p>
              <p style="margin-top:8px;color:var(--primary);font-weight:700">意境：秋日黄昏，游子独行荒凉古道——<strong>萧瑟、苍凉、孤寂</strong></p>
            </div>
            <p>关键公式：<strong>意象群 → 意境 → 情感共鸣</strong></p>
          </div>
        `
      },
      {
        title: '第四讲：意象与情感的关系',
        duration: '1分15秒',
        content: `
          <div style="font-size:16px;line-height:2">
            <p>为什么同一个意象表达不同情感？</p>
            <div style="display:flex;flex-direction:column;gap:10px;margin:12px 0">
              ${[
                { q: '诗人身份不同', a: '游子看月思乡，哲人看月思考人生' },
                { q: '创作背景不同', a: '中秋欢聚 vs 贬谪流放' },
                { q: '搭配意象不同', a: '月+酒=旷达，月+霜=清冷' },
                { q: '表达主题不同', a: '同一个月亮，千种情感' }
              ].map(item => `
                <div style="display:flex;gap:12px;align-items:center;background:var(--bg);padding:12px 16px;border-radius:8px">
                  <span style="background:var(--primary);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">❓</span>
                  <div><strong>${item.q}：</strong><span style="color:var(--text-secondary)">${item.a}</span></div>
                </div>
              `).join('')}
            </div>
          </div>
        `
      }
    ];

    main.innerHTML = `
      <div class="page-header">
        <h2>🎬 微视频导学</h2>
        <p>课前观看微课视频，了解诗歌意象的基础知识 | 共4讲 · 约${MICRO_VIDEO.duration}</p>
      </div>

      <!-- 视频播放区 -->
      <div class="card" style="overflow:hidden;padding:0">
        <div style="position:relative;background:linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);padding:32px;text-align:center;color:white;min-height:320px;display:flex;flex-direction:column;align-items:center;justify-content:center" id="videoPlayerArea">
          <div id="videoPlayerContent">
            <div style="font-size:72px;margin-bottom:8px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))">🎬</div>
            <h2 style="font-size:24px;margin-bottom:8px;font-weight:700">${MICRO_VIDEO.title}</h2>
            <p style="opacity:0.8;font-size:15px;margin-bottom:16px">${MICRO_VIDEO.description}</p>
            <div style="display:flex;gap:8px;margin-bottom:16px">
              ${chapters.map((ch, i) => `
                <div class="video-chapter-dot" onclick="App.selectVideoChapter(${i})" 
                     style="width:10px;height:10px;border-radius:50%;background:${i===0?'var(--accent)':'rgba(255,255,255,0.3)'};cursor:pointer;transition:all 0.3s"
                     id="chapterDot${i}"></div>
              `).join('')}
            </div>
            <p style="font-size:12px;opacity:0.6">⬆️ 点击上方圆点切换章节</p>
          </div>
        </div>
      </div>

      <!-- 章节内容 -->
      <div class="card" id="videoChapterContent">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div class="card-title" id="videoChapterTitle" style="margin-bottom:0">${chapters[0].title}</div>
          <span class="tag tag-accent" id="videoChapterDuration">⏱ ${chapters[0].duration}</span>
        </div>
        <div id="videoChapterBody">${chapters[0].content}</div>
      </div>

      <!-- 章节导航 -->
      <div class="card">
        <div class="card-title">📑 课程目录</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${chapters.map((ch, i) => `
            <div class="video-chapter-card" onclick="App.selectVideoChapter(${i})" id="chapterCard${i}"
                 style="display:flex;align-items:center;gap:12px;padding:14px 16px;background:${i===0?'rgba(45,90,39,0.05)':'var(--bg)'};border-radius:10px;cursor:pointer;transition:all 0.2s;border:2px solid ${i===0?'var(--primary)':'transparent'}">
              <div style="width:32px;height:32px;border-radius:50%;background:${i===0?'var(--primary)':'var(--text-secondary)'};color:white;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0">${i+1}</div>
              <div style="flex:1">
                <div style="font-weight:600">${ch.title}</div>
                <div style="font-size:12px;color:var(--text-secondary)">⏱ ${ch.duration}</div>
              </div>
              ${i===0 ? '<span style="color:var(--primary);font-size:20px">▶️</span>' : '<span style="color:var(--text-secondary)">▶</span>'}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 核心问题 -->
      <div class="card" style="border-left:4px solid var(--info)">
        <div class="card-title">🤔 带着问题进入课堂</div>
        <p style="font-size:17px;font-weight:600;color:var(--info);margin-bottom:8px">${MICRO_VIDEO.question}</p>
        <p style="color:var(--text-secondary)">提示：回想微课中各意象的不同情感表达，试着在后面的"意象情感地图"中找到答案。</p>
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <span class="tag tag-primary">提示：诗人身份</span>
          <span class="tag tag-accent">提示：创作背景</span>
          <span class="tag tag-info">提示：搭配意象</span>
          <span class="tag tag-success">提示：表达主题</span>
        </div>
      </div>

      <div class="banner banner-info" style="margin-top:16px">
        💡 完成微课学习后，带着<strong>"为什么同一个意象在不同诗歌中表达不同情感？"</strong>的问题进入课堂探究。
      </div>
    `;
  },

  selectVideoChapter(idx) {
    const chapters = [
      {
        title: '第一讲：什么是意象？', duration: '1分30秒',
        content: `<div style="font-size:16px;line-height:2"><p><strong>意象</strong> = <span style="color:var(--primary);font-weight:700">意</span>（主观情意）+ <span style="color:var(--accent);font-weight:700">象</span>（客观物象）</p><p>诗人将自己的<strong>情感、思想</strong>寄托于具体的<strong>景物、事物</strong>之上，使客观物象成为主观情意的载体。</p><div style="background:var(--bg);padding:16px;border-radius:10px;margin:12px 0"><p style="font-style:italic;margin-bottom:8px">🌙 例："举头望明月，低头思故乡。"</p><p>"明月"是<strong>象</strong>，"思乡"是<strong>意</strong>——诗人看到月亮，想起了家乡。</p></div><p>同一物象在不同诗人笔下，可以承载<strong>完全不同的情感</strong>——这正是意象的魅力所在。</p></div>`
      },
      {
        title: '第二讲：常见意象分类', duration: '1分30秒',
        content: `<div style="font-size:16px;line-height:2"><p>古典诗词中形成了<strong>相对稳定</strong>的意象系统：</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:12px 0">${[['🌙 月','思乡、团圆、思念'],['🌿 柳','送别、挽留、惜别'],['🕊️ 雁','思乡、漂泊、音信'],['🍶 酒','豪迈、解愁、旷达'],['🌸 梅','坚贞、高洁、傲骨'],['🎋 竹','不屈、高洁、隐逸'],['🏵️ 菊','隐逸、高洁、愁思'],['🌅 夕阳','时光流逝、壮阔、思乡']].map(([n,m])=>`<div style="background:var(--bg);padding:10px 14px;border-radius:8px;display:flex;align-items:center;gap:8px"><span style="font-size:18px">${n.split(' ')[0]}</span><div><strong>${n.split(' ')[1]}</strong><br><small style="color:var(--text-secondary)">${m}</small></div></div>`).join('')}</div></div>`
      },
      {
        title: '第三讲：意象 → 意境', duration: '1分15秒',
        content: `<div style="font-size:16px;line-height:2"><p><strong>意象</strong>是单个的、具体的；<strong>意境</strong>是整体的、综合的。</p><div style="background:var(--bg);padding:16px;border-radius:10px;margin:12px 0"><p style="font-weight:700;margin-bottom:8px">《天净沙·秋思》：</p><p>意象：枯藤、老树、昏鸦、小桥、流水、人家、古道、西风、瘦马、夕阳</p><p style="margin-top:8px"><strong>↓ 组合 ↓</strong></p><p style="margin-top:8px;color:var(--primary);font-weight:700">意境：秋日黄昏，游子独行荒凉古道——<strong>萧瑟、苍凉、孤寂</strong></p></div><p>关键公式：<strong>意象群 → 意境 → 情感共鸣</strong></p></div>`
      },
      {
        title: '第四讲：意象与情感的关系', duration: '1分15秒',
        content: `<div style="font-size:16px;line-height:2"><p>为什么同一个意象表达不同情感？</p><div style="display:flex;flex-direction:column;gap:10px;margin:12px 0">${[{q:'诗人身份不同',a:'游子看月思乡，哲人看月思考人生'},{q:'创作背景不同',a:'中秋欢聚 vs 贬谪流放'},{q:'搭配意象不同',a:'月+酒=旷达，月+霜=清冷'},{q:'表达主题不同',a:'同一个月亮，千种情感'}].map(item=>`<div style="display:flex;gap:12px;align-items:center;background:var(--bg);padding:12px 16px;border-radius:8px"><span style="background:var(--primary);color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">❓</span><div><strong>${item.q}：</strong><span style="color:var(--text-secondary)">${item.a}</span></div></div>`).join('')}</div></div>`
      }
    ];

    const ch = chapters[idx];
    document.getElementById('videoChapterTitle').textContent = ch.title;
    document.getElementById('videoChapterDuration').textContent = '⏱ ' + ch.duration;
    document.getElementById('videoChapterBody').innerHTML = ch.content;

    // Update dots
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('chapterDot' + i);
      if (dot) dot.style.background = i === idx ? 'var(--accent)' : 'rgba(255,255,255,0.3)';
      const card = document.getElementById('chapterCard' + i);
      if (card) {
        card.style.background = i === idx ? 'rgba(45,90,39,0.05)' : 'var(--bg)';
        card.style.borderColor = i === idx ? 'var(--primary)' : 'transparent';
        const numEl = card.querySelector('div');
        if (numEl) numEl.style.background = i === idx ? 'var(--primary)' : 'var(--text-secondary)';
        const arrow = card.querySelector('span:last-child');
        if (arrow) arrow.innerHTML = i === idx ? '▶️' : '▶';
      }
    }
  },

  // ==========================================
  // 3. 古人的朋友圈
  // ==========================================
  renderMoments(main) {
    // 先用本地数据渲染，再异步更新为 Vika 数据
    this._renderMomentsWithData(main, MOMENTS_DATA);
    VikaAPI.fetchTable('moments').then(items => {
      if (!items || items.length === 0) return;
      // 将 Vika 格式转换为本地格式
      const vikaData = items.map(item => ({
        id: item.id,
        studentName: item['学生姓名'] || item.studentName || '古诗人',
        imagery: item['意象'] || item.imagery || '',
        content: item['内容'] || item.content || '',
        verses: (item['相关诗句'] || item.verses || '').split('\n').filter(v => v.trim()),
        symbolism: item['象征意义'] || item.symbolism || '',
        question: item['提问'] || item.question || '',
        likes: parseInt(item['点赞数'] || item.likes || 0),
        comments: []
      }));
      // 只有当 Vika 数据比本地多时才更新，避免闪烁
      if (vikaData.length >= MOMENTS_DATA.length) {
        this._renderMomentsWithData(main, vikaData);
      }
    });
  },

  _renderMomentsWithData(main, data) {
    main.innerHTML = `
      <div class="page-header">
        <h2>💬 假如古人有朋友圈</h2>
        <p>以意象第一人称发帖，附诗句+象征意义+思考问题</p>
      </div>
      <div style="margin-bottom:20px">
        <button class="btn btn-primary" onclick="App.showCreateMoment()">✏️ 发布新朋友圈</button>
      </div>
      ${data.map(m => `
        <div class="moment-card">
          <div class="moment-header">
            <div class="moment-avatar">${IMAGERIES.find(i => i.name === m.imagery)?.emoji || '📝'}</div>
            <div class="moment-meta">
              <div class="name">${m.studentName} <span class="tag tag-accent" style="margin-left:8px">意象：${m.imagery}</span></div>
              <div class="time">课前任务 · ${m.likes}人点赞</div>
            </div>
          </div>
          <div class="moment-body">
            <p>${m.content}</p>
            ${(Array.isArray(m.verses) ? m.verses : [m.verses]).filter(v=>v).map(v => `<span class="verse">"${v}"</span>`).join('')}
            <p style="margin-top:8px"><span class="tag tag-info">象征意义</span> ${m.symbolism}</p>
            <p class="question">💡 ${m.question}</p>
          </div>
          <div class="moment-actions">
            <span>👍 赞 (${m.likes})</span>
            <span>💬 评论 (${(m.comments||[]).length})</span>
            <span>🔄 分享</span>
          </div>
          ${(m.comments||[]).length > 0 ? `
            <div class="moment-comments">
              ${m.comments.map(c => `
                <div class="moment-comment"><strong>${c.studentName}：</strong>${c.text}</div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    `;
  },

  showCreateMoment() {
    const imageryOptions = IMAGERIES.map(i => `<option value="${i.name}">${i.emoji} ${i.name}</option>`).join('');
    const modal = document.getElementById('modalContainer');
    modal.innerHTML = `
      <div class="modal-overlay" onclick="if(event.target===this) App.closeModal()">
        <div class="modal">
          <h3>✏️ 发布新朋友圈</h3>
          <div class="form-group"><label>选择意象</label><select class="form-input" id="newMomentImagery">${imageryOptions}</select></div>
          <div class="form-group"><label>朋友圈文字（意象自述）</label><input class="form-input" id="newMomentContent" placeholder="例如：今天又被诗人写进诗里了。"></div>
          <div class="form-group"><label>配套诗句（每行一句）</label><textarea class="form-textarea" id="newMomentVerses" placeholder='"举头望明月，低头思故乡。"&#10;"但愿人长久，千里共婵娟。"'></textarea></div>
          <div class="form-group"><label>常见象征意义</label><input class="form-input" id="newMomentSymbolism" placeholder="例如：思乡、团圆、思念"></div>
          <div class="form-group"><label>提出思考问题</label><input class="form-input" id="newMomentQuestion" placeholder="例如：大家觉得我究竟代表思乡还是团圆？"></div>
          <div style="display:flex;gap:12px;margin-top:20px">
            <button class="btn btn-primary" onclick="App.submitMoment()">发布</button>
            <button class="btn btn-outline" onclick="App.closeModal()">取消</button>
          </div>
        </div>
      </div>
    `;
  },

  async submitMoment() {
    const imagery = document.getElementById('newMomentImagery').value;
    const content = document.getElementById('newMomentContent').value.trim();
    const verses = document.getElementById('newMomentVerses').value.trim();
    const symbolism = document.getElementById('newMomentSymbolism').value.trim();
    const question = document.getElementById('newMomentQuestion').value.trim();

    if (!content) { alert('请填写朋友圈文字'); return; }

    const btn = document.querySelector('#modalContainer .btn-primary');
    if (btn) { btn.disabled = true; btn.textContent = '发布中...'; }

    const student = App.currentUser?.name || '匿名学生';
    const result = await VikaAPI.submitMoment(student, imagery, content, verses, symbolism, question);

    if (btn) { btn.disabled = false; btn.textContent = '发布'; }

    if (result && result.success) {
      // 同步到本地数据以便立即展示
      MOMENTS_DATA.unshift({
        id: 'm' + Date.now(),
        studentName: student,
        imagery,
        content,
        verses: verses.split('\n').filter(v => v.trim()),
        symbolism,
        question,
        likes: 0,
        comments: []
      });
      this.closeModal();
      this.renderPage('moments');
    } else {
      alert('❌ 发布失败：' + (result?.message || result?.error || '网络异常，请重试'));
      if (btn) { btn.disabled = false; btn.textContent = '发布'; }
    }
  },

  closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
  },

  // ==========================================
  // 4. 意象资源库
  // ==========================================
  renderResourceLib(main) {
    main.innerHTML = `
      <div class="page-header">
        <h2>📚 班级意象资源库</h2>
        <p>集体共建的诗歌意象知识库，涵盖典型意象、诗句、文化内涵与情感表达</p>
      </div>
      <div class="filter-bar">
        <div class="filter-chip active" onclick="App.filterResources('all', this)">全部</div>
        ${IMAGERIES.map(i => `
          <div class="filter-chip" onclick="App.filterResources('${i.id}', this)">${i.emoji} ${i.name}</div>
        `).join('')}
      </div>
      <div class="card" id="resourceTableContainer">
        <table class="table resource-table">
          <thead><tr><th>意象</th><th>篇目</th><th>作者</th><th>经典诗句</th><th>情感表达</th></tr></thead>
          <tbody id="resourceTableBody">
            ${IMAGERIES.flatMap(img => img.poems.map(p => `
              <tr data-imagery="${img.id}">
                <td><strong>${img.emoji} ${img.name}</strong></td>
                <td>《${p.title}》</td>
                <td>${p.author}</td>
                <td style="font-style:italic">${p.verse}</td>
                <td><span class="tag tag-accent">${p.emotion}</span></td>
              </tr>
            `)).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  filterResources(id, el) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    document.querySelectorAll('#resourceTableBody tr').forEach(row => {
      row.style.display = (id === 'all' || row.dataset.imagery === id) ? '' : 'none';
    });
  },

  // ==========================================
  // 5. 意象组合挑战赛
  // ==========================================
  renderChallenge(main) {
    const state = this.challengeState;
    const level = CHALLENGE_LEVELS[state.level - 1];
    const totalItems = level.items.length;

    // Level selection tabs
    const levelTabs = CHALLENGE_LEVELS.map((l, i) => `
      <button class="challenge-level-tab" onclick="App.switchChallengeLevel(${l.level})"
              style="padding:8px 18px;border-radius:8px;border:2px solid ${l.level===state.level?'var(--primary)':'var(--border)'};background:${l.level===state.level?'rgba(45,90,39,0.06)':'white'};cursor:pointer;font-weight:${l.level===state.level?'700':'400'};transition:all 0.2s;font-size:14px"
              id="challengeTab${l.level}">
        ${l.level===state.level?'▶ ':''}${l.title}
      </button>
    `).join('');

    let challengeBody = '';
    if (level.type === 'guess_poem') {
      const item = level.items[state.currentItem];
      challengeBody = this._renderGuessPoem(item, level, state);
    } else if (level.type === 'analyze') {
      const item = level.items[state.currentItem];
      challengeBody = this._renderAnalyze(item, level, state);
    } else if (level.type === 'matching') {
      const item = level.items[state.currentItem];
      challengeBody = this._renderMatching(item, level, state);
    } else if (level.type === 'creative') {
      const item = level.items[state.currentItem];
      challengeBody = this._renderCreative(item, level, state);
    }

    main.innerHTML = `
      <div class="page-header">
        <h2>⚔️ 意象组合挑战赛</h2>
        <p>${level.title} | 第 ${state.currentItem + 1}/${totalItems} 题 | 得分：<strong id="challengeScore">${state.score}</strong>分</p>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px" id="challengeTabs">
        ${levelTabs}
      </div>

      ${challengeBody}

      <div style="margin-top:16px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        ${state.currentItem > 0 ? `<button class="btn btn-outline" onclick="App.prevChallengeItem()">⬅️ 上一题</button>` : ''}
        <button class="btn btn-outline" onclick="App.nextChallengeItem()" id="nextChallengeBtn" style="display:${state.answered||level.type==='creative'?'inline-flex':'none'}">下一题 ➡️</button>
        <button class="btn btn-accent" onclick="App.resetChallenge()">🔄 重新开始</button>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-title">🏆 排行榜</div>
        <table class="table">
          <thead><tr><th>排名</th><th>小组</th><th>得分</th><th>状态</th></tr></thead>
          <tbody>
            ${['第1组','第2组','第3组'].map((g, i) => `
              <tr>
                <td>${i+1}</td><td><strong>${g}</strong></td>
                <td>${[8,6,4][i]}题</td>
                <td><span class="tag ${i===0?'tag-success':'tag-info'}">${i===0?'领先':'进行中'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  _renderGuessPoem(item, level, state) {
    // Shuffle answers
    const allAnswers = CHALLENGE_LEVELS[0].items.map(it => it.answer);
    const shuffled = [...new Set([item.answer, ...allAnswers])].slice(0, 4);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return `
      <div class="card" style="text-align:center">
        <div class="card-title" style="justify-content:center">🔍 请看以下意象，联想对应的诗篇</div>
        <div class="challenge-imageries" style="justify-content:center">
          ${item.imageries.map(i => `<div class="imagery-chip">${i}</div>`).join('')}
        </div>
        <div class="answer-group-buttons" id="challengeAnswers">
          ${shuffled.map(a => `
            <button class="answer-btn" onclick="App.checkChallengeAnswer('${a}', this)">${a}</button>
          `).join('')}
        </div>
        <div id="challengeFeedback" style="margin-top:16px"></div>
      </div>
    `;
  },

  _renderAnalyze(item, level, state) {
    return `
      <div class="card">
        <div class="card-title">🔬 分析意象组合</div>
        <div class="challenge-imageries" style="margin-bottom:16px">
          ${item.imageries.map(i => `<div class="imagery-chip">${i}</div>`).join('')}
        </div>
        ${item.questions.map((q, i) => `
          <div class="form-group">
            <label>${i+1}. ${q}</label>
            <input class="form-input" id="analyzeAnswer${i}" placeholder="请输入你的分析...">
          </div>
        `).join('')}
        <div style="margin-top:12px;display:flex;gap:12px;align-items:center">
          <button class="btn btn-accent" onclick="App.submitAnalyzeAnswer()">✅ 提交分析</button>
          <button class="btn btn-outline" onclick="App.revealAnalyzeReference()">💡 查看参考</button>
        </div>
        <div id="analyzeFeedback" style="margin-top:12px"></div>
        <div id="analyzeReference" style="display:none;margin-top:12px;padding:16px;background:rgba(16,185,129,0.06);border-radius:10px;border-left:4px solid var(--success)">
          <strong>📖 参考答案：</strong><br>
          <strong>画面：</strong>${item.reference.scene}<br>
          <strong>意境：</strong>${item.reference.mood}<br>
          <strong>情感：</strong>${item.reference.emotion}
        </div>
      </div>
    `;
  },

  _renderMatching(item, level, state) {
    // Shuffle emotions
    const shuffled = [...item.pairs];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    state.matching = state.matching || {};
    state._matchPairs = item.pairs;
    state._shuffledEmotions = shuffled.map(s => s.emotion);

    return `
      <div class="card">
        <div class="card-title">🔗 ${item.instruction}</div>
        <p style="color:var(--text-secondary);margin-bottom:16px">${item.story}</p>
        <div style="display:flex;gap:24px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px">
            <h4 style="margin-bottom:12px">意象</h4>
            ${item.pairs.map((p, i) => `
              <div class="match-imagery" id="matchImg${i}" onclick="App.selectMatchImagery(${i})"
                   style="padding:12px 16px;background:var(--bg);border-radius:8px;margin-bottom:8px;cursor:pointer;border:2px solid var(--border);transition:all 0.2s;font-weight:600">
                ${p.imagery}
              </div>
            `).join('')}
          </div>
          <div style="flex:1;min-width:180px">
            <h4 style="margin-bottom:12px">情感</h4>
            ${state._shuffledEmotions.map((e, i) => `
              <div class="match-emotion" id="matchEmo${i}" onclick="App.selectMatchEmotion('${e}', ${i})"
                   style="padding:12px 16px;background:var(--bg);border-radius:8px;margin-bottom:8px;cursor:pointer;border:2px solid var(--border);transition:all 0.2s">
                ${e}
              </div>
            `).join('')}
          </div>
        </div>
        <div style="margin-top:16px">
          <button class="btn btn-accent" onclick="App.checkMatchingAnswer()">✅ 提交匹配</button>
        </div>
        <div id="matchingFeedback" style="margin-top:12px"></div>
      </div>
    `;
  },

  _renderCreative(item, level, state) {
    return `
      <div class="card">
        <div class="card-title">🎨 创意意象组合</div>
        <p style="color:var(--text-secondary);margin-bottom:8px">${item.task}</p>
        <div style="margin-bottom:16px;padding:16px;background:var(--bg);border-radius:10px">
          <strong>📦 可选意象：</strong>
          <div class="challenge-imageries" style="margin-top:8px">
            ${item.given.map(i => `<div class="imagery-chip" style="cursor:pointer" onclick="App.toggleCreativeImagery('${i}', this)">${i}</div>`).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>✍️ 我的意象组合创作：</label>
          <textarea class="form-textarea" id="creativeAnswer" rows="5" placeholder="例：${item.example}"></textarea>
        </div>
        <div style="margin-bottom:16px">
          <button class="btn btn-outline btn-sm" onclick="App.toggleCreativeWhiteboard()" id="creativeWbBtn">
            🎨 在协作白板上创作
          </button>
        </div>
        <div id="creativeWhiteboardArea" style="display:none;margin-bottom:16px">
          <div id="creativeWbToolbar"></div>
          <div id="creativeWbCanvas" style="height:400px;background:var(--bg);border-radius:12px;position:relative;overflow:hidden;border:2px solid var(--border)">
            <canvas id="creativeWbCanvasEl"></canvas>
          </div>
        </div>
        <div style="margin-top:8px;padding:12px;background:rgba(59,130,246,0.06);border-radius:8px;border-left:4px solid var(--info)">
          <strong>💡 创作提示：</strong><br>
          ${item.tips.map(t => `• ${t}`).join('<br>')}
        </div>
        <div style="margin-top:12px;display:flex;gap:12px">
          <button class="btn btn-accent" onclick="App.submitCreativeAnswer()">✅ 提交创作</button>
          <button class="btn btn-outline" onclick="App.showCreativeExample()">💡 查看示例</button>
        </div>
        <div id="creativeFeedback" style="margin-top:12px"></div>
        <div id="creativeExample" style="display:none;margin-top:12px;padding:16px;background:rgba(16,185,129,0.06);border-radius:10px;border-left:4px solid var(--success)">
          <strong>📖 参考示例：</strong><br>${item.example}
        </div>
      </div>
    `;
  },

  toggleCreativeWhiteboard() {
    const area = document.getElementById('creativeWhiteboardArea');
    if (!area) return;
    const btn = document.getElementById('creativeWbBtn');
    if (area.style.display === 'none') {
      area.style.display = 'block';
      if (btn) btn.textContent = '🙈 收起白板';
      // 初始化白板
      setTimeout(() => {
        const canvasEl = document.getElementById('creativeWbCanvasEl');
        const container = document.getElementById('creativeWbCanvas');
        if (canvasEl && container) {
          canvasEl.width = container.offsetWidth || 700;
          canvasEl.height = 400;
        }
        Whiteboard.init('creativeWbCanvasEl', 'creative_challenge', {
          role: 'student',
          username: this.currentUser?.name || '学生',
        });
        Whiteboard.setToolbar('creativeWbToolbar');
      }, 200);
    } else {
      area.style.display = 'none';
      if (btn) btn.textContent = '🎨 在协作白板上创作';
      Whiteboard.destroy();
    }
  },

  switchChallengeLevel(level) {
    this.challengeState = { level, currentItem: 0, score: this.challengeState.score, answered: false, matching: {} };
    this.renderPage('challenge');
  },

  checkChallengeAnswer(answer, btn) {
    if (this.challengeState.answered) return;
    this.challengeState.answered = true;
    const level = CHALLENGE_LEVELS[0];
    const item = level.items[this.challengeState.currentItem];

    const isCorrect = answer === item.answer;
    if (isCorrect) {
      btn.classList.add('correct');
      this.challengeState.score += 10;
      document.getElementById('challengeFeedback').innerHTML = `
        <div class="banner banner-success">✅ 正确！这就是《${item.answer}》（${item.author}）</div>
      `;
    } else {
      btn.classList.add('wrong');
      document.querySelectorAll('.answer-btn').forEach(b => {
        if (b.textContent.trim() === item.answer) b.classList.add('correct');
      });
      document.getElementById('challengeFeedback').innerHTML = `
        <div class="banner banner-warning">❌ 正确答案是《${item.answer}》（${item.author}）</div>
      `;
    }
    document.getElementById('challengeScore').textContent = this.challengeState.score;
    document.getElementById('nextChallengeBtn').style.display = 'inline-flex';
  },

  async submitAnalyzeAnswer() {
    this.challengeState.answered = true;
    const level = CHALLENGE_LEVELS[1];
    const item = level.items[this.challengeState.currentItem];
    const studentAnswer = Array.from(document.querySelectorAll('[id^="analyzeAnswer"]'))
      .map(el => el.value.trim()).filter(v => v).join('；');

    // 显示评分中状态
    document.getElementById('analyzeFeedback').innerHTML = `
      <div class="banner banner-info">🤖 AI正在评估你的分析...</div>
    `;

    // 调用 DeepSeek 智能评分
    const ref = item.reference || {};
    const result = await DeepSeekAPI.scoreAnswer(
      studentAnswer || '未作答',
      { imageries: (ref.imageries || item.imageries || []), mood: ref.mood || '', emotion: ref.emotion || '' },
      item.questions ? item.questions.join(' ') : ''
    );

    const score = result?.score || 8;
    const feedback = result?.feedback || '请查看参考答案对比你的分析。';
    const highlights = result?.highlights || [];
    const suggestions = result?.suggestions || [];
    const correctImg = result?.correct_imageries || [];
    const missing = result?.missing || [];

    this.challengeState.score += score;
    document.getElementById('challengeScore').textContent = this.challengeState.score;
    document.getElementById('analyzeFeedback').innerHTML = `
      <div class="banner ${score >= 70 ? 'banner-success' : score >= 50 ? 'banner-warning' : 'banner-warning'}">
        ✅ 分析已提交！AI评分：<strong>${score}分</strong>
      </div>
      <div style="margin-top:12px;padding:16px;background:var(--bg);border-radius:10px;line-height:1.8">
        <p><strong>📝 AI评语：</strong>${feedback}</p>
        ${highlights.length ? `<p style="margin-top:8px;color:var(--success)">🌟 亮点：${highlights.join('、')}</p>` : ''}
        ${suggestions.length ? `<p style="margin-top:4px;color:var(--info)">💡 建议：${suggestions.join('、')}</p>` : ''}
        ${correctImg.length ? `<p style="margin-top:4px">✅ 命中意象：${correctImg.join('、')}</p>` : ''}
        ${missing.length ? `<p style="margin-top:4px;color:var(--danger)">⚠️ 遗漏意象：${missing.join('、')}</p>` : ''}
      </div>
    `;
    document.getElementById('nextChallengeBtn').style.display = 'inline-flex';

    // 保存到Vika学习记录
    VikaAPI.recordScore(
      App.currentUser?.name || '学生',
      '课中挑战赛',
      '意境析题(AI评分)',
      score,
      `作答：${(studentAnswer || '未作答').substring(0, 80)}`
    );
  },

  revealAnalyzeReference() {
    const el = document.getElementById('analyzeReference');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  selectMatchImagery(idx) {
    this.challengeState._selectedImagery = idx;
    document.querySelectorAll('.match-imagery').forEach((el, i) => {
      el.style.borderColor = i === idx ? 'var(--primary)' : 'var(--border)';
      el.style.background = i === idx ? 'rgba(45,90,39,0.08)' : 'var(--bg)';
    });
  },

  selectMatchEmotion(emotion, idx) {
    if (this.challengeState._selectedImagery === undefined) {
      alert('请先点击左侧选择一个意象');
      return;
    }
    const imgIdx = this.challengeState._selectedImagery;
    const pairs = this.challengeState._matchPairs;
    const correct = pairs[imgIdx].emotion;

    this.challengeState.matching = this.challengeState.matching || {};
    this.challengeState.matching[imgIdx] = emotion;

    // Visual feedback
    const imgEl = document.getElementById('matchImg' + imgIdx);
    const emoEl = document.getElementById('matchEmo' + idx);
    if (emotion === correct) {
      imgEl.style.borderColor = 'var(--success)';
      imgEl.style.background = 'rgba(16,185,129,0.1)';
      emoEl.style.borderColor = 'var(--success)';
      emoEl.style.background = 'rgba(16,185,129,0.1)';
      imgEl.innerHTML = pairs[imgIdx].imagery + ' ✅';
    } else {
      imgEl.style.borderColor = 'var(--danger)';
      imgEl.style.background = 'rgba(239,68,68,0.08)';
      imgEl.innerHTML = pairs[imgIdx].imagery + ' ❌';
    }
    this.challengeState._selectedImagery = undefined;
    document.querySelectorAll('.match-imagery').forEach(el => {
      el.style.borderColor = el.style.borderColor || 'var(--border)';
    });
  },

  checkMatchingAnswer() {
    const pairs = this.challengeState._matchPairs;
    const matching = this.challengeState.matching || {};
    let correct = 0;
    pairs.forEach((p, i) => {
      if (matching[i] === p.emotion) correct++;
    });
    this.challengeState.answered = true;
    const score = Math.round(correct / pairs.length * 15);
    this.challengeState.score += score;
    document.getElementById('challengeScore').textContent = this.challengeState.score;
    document.getElementById('matchingFeedback').innerHTML = `
      <div class="banner ${correct===pairs.length?'banner-success':'banner-info'}">
        ${correct===pairs.length?'🎉 全部匹配正确！':'📝 匹配结果：'+correct+'/'+pairs.length+' 正确'}
        获得 <strong>${score}分</strong>
      </div>
    `;
    document.getElementById('nextChallengeBtn').style.display = 'inline-flex';
    // 保存到Vika学习记录
    VikaAPI.recordScore(
      App.currentUser?.name || '学生',
      '课中挑战赛',
      '连连看',
      score,
      `正确 ${correct}/${pairs.length} 对`
    );
  },

  toggleCreativeImagery(imagery, el) {
    el.classList.toggle('selected');
    if (el.classList.contains('selected')) {
      el.style.background = 'var(--primary)';
      el.style.color = 'white';
      const ta = document.getElementById('creativeAnswer');
      if (ta) {
        const current = ta.value;
        if (!current.includes(imagery)) {
          ta.value = current ? current + '、' + imagery : '我选"' + imagery;
        }
      }
    } else {
      el.style.background = '';
      el.style.color = '';
    }
  },

  submitCreativeAnswer() {
    const answer = document.getElementById('creativeAnswer')?.value?.trim();
    if (!answer) { alert('请先写下你的意象组合创作'); return; }
    this.challengeState.answered = true;
    this.challengeState.score += 10;
    document.getElementById('challengeScore').textContent = this.challengeState.score;
    document.getElementById('creativeFeedback').innerHTML = `
      <div class="banner banner-success">✅ 创作已提交！获得 <strong>10分</strong>（创意参与分）</div>
      <p style="color:var(--text-secondary);font-size:13px;margin-top:4px">精彩！课堂展示环节将评选最佳意象组合。</p>
    `;
    document.getElementById('nextChallengeBtn').style.display = 'inline-flex';
    // 保存到Vika学习记录
    VikaAPI.recordScore(
      App.currentUser?.name || '学生',
      '课中挑战赛',
      '创意组合',
      10,
      `创作内容：${answer.substring(0, 100)}`
    );
  },

  showCreativeExample() {
    const el = document.getElementById('creativeExample');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  prevChallengeItem() {
    this.challengeState.currentItem--;
    if (this.challengeState.currentItem < 0) this.challengeState.currentItem = 0;
    this.challengeState.answered = false;
    this.challengeState.matching = {};
    this.renderPage('challenge');
  },

  nextChallengeItem() {
    const level = CHALLENGE_LEVELS[this.challengeState.level - 1];
    this.challengeState.currentItem++;
    this.challengeState.answered = false;
    this.challengeState.matching = {};

    // Check if current level is done
    if (this.challengeState.currentItem >= level.items.length) {
      if (this.challengeState.level < CHALLENGE_LEVELS.length) {
        // Auto-advance to next level
        const nextLevel = this.challengeState.level + 1;
        if (confirm(`🎉 "${level.title}" 完成！\n\n当前总得分：${this.challengeState.score}分\n\n是否进入"${CHALLENGE_LEVELS[nextLevel-1].title}"？`)) {
          this.challengeState.level = nextLevel;
          this.challengeState.currentItem = 0;
          this.renderPage('challenge');
          return;
        }
      } else {
        alert(`🏆 所有关卡完成！\n\n最终得分：${this.challengeState.score}分\n\n恭喜你完成了意象组合挑战赛的全部挑战！`);
        return;
      }
    }
    this.renderPage('challenge');
  },

  resetChallenge() {
    if (confirm('确定要重新开始挑战赛吗？当前得分将被清零。')) {
      this.challengeState = { level: 1, currentItem: 0, score: 0, answered: false, matching: {} };
      this.renderPage('challenge');
    }
  },

  // ==========================================
  // 6. 意象情感地图
  // ==========================================
  renderMindmap(main) {
    const data = EMOTION_MAP;
    const centerImg = IMAGERIES.find(i => i.name === data.center);

    // Initialize node positions in state (pixel values relative to container)
    if (!this.mindmapNodes) {
      this.mindmapNodes = data.branches.map((b, i) => {
        const angles = [0, 90, 180, 270];
        const angle = angles[i] * Math.PI / 180;
        const r = 160;
        return {
          id: i,
          name: b.poem,
          emoji: IMAGERIES.find(img => img.poems.some(p => p.title === b.poem))?.emoji || '📜',
          poem: b.poem,
          author: b.author,
          emotion: b.emotion,
          color: b.color,
          x: 250 + r * Math.cos(angle),
          y: 230 + r * Math.sin(angle)
        };
      });
      this.mindmapDragging = null;
      this.mindmapDragOffset = { x: 0, y: 0 };
      this.mindmapMode = 'classic'; // 'classic' | 'collab'
    }

    main.innerHTML = `
      <div class="page-header">
        <h2>🗺️ 意象情感地图</h2>
        <p>以一个核心意象为中心，构建情感网络图 | 小组合作探究 | 支持协作白板模式</p>
      </div>

      <div class="card">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-primary btn-sm" id="mindmapModeBtn"
                  onclick="App.toggleMindmapMode()">
            🎨 协作画布（可选）
          </button>
          <button class="btn btn-outline btn-sm" onclick="App.addMindmapBranch()">➕ 新增分支</button>
          <button class="btn btn-outline btn-sm" onclick="App.resetMindmapLayout()">🔄 重置布局</button>
          <select id="mindmapGroupSelect" style="display:none;padding:6px 12px;border-radius:8px;border:2px solid var(--border);font-size:13px;margin-left:8px"
                  onchange="App.switchMindmapRoom()">
            <option value="group_1">第1组</option>
            <option value="group_2">第2组</option>
            <option value="group_3">第3组</option>
            <option value="teacher_board">教师白板</option>
          </select>
          <span id="mindmapConnStatus" style="display:none;margin-left:auto;font-size:12px;color:var(--text-secondary)"></span>
        </div>
        <div id="mindmapToolbarContainer"></div>
        <div id="mindmapCanvasContainer"
             style="height:500px;background:var(--bg);border-radius:12px;position:relative;overflow:hidden">
        </div>
      </div>

      <div class="card">
        <div class="card-title">🔍 小组讨论：为什么同一个意象会表达不同情感？</div>
        <div class="grid-2">
          ${data.analysis.reasons.map((r, i) => `
            <div style="padding:16px;background:var(--bg);border-radius:10px;display:flex;align-items:center;gap:12px">
              <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0">${i+1}</div>
              <span style="font-size:15px">${r}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-title">📊 各小组探究记录</div>
        <div class="grid-3">
          ${USERS.students.filter(s => s.group).map((s, i) => {
            const colors = ['#3B82F6','#10B981','#F59E0B'];
            return i < 3 ? `
              <div style="padding:14px;background:var(--bg);border-radius:10px;border-left:4px solid ${colors[i]};cursor:pointer"
                   onclick="App.joinMindmapRoom('${['group_1','group_2','group_3'][i]}')">
                <strong>${s.group}</strong><br>
                <small style="color:var(--text-secondary)">组员：${s.name}</small><br>
                <small style="color:var(--text-secondary)">点击进入协作白板 →</small>
              </div>
            ` : '';
          }).join('')}
        </div>
      </div>
    `;

    // 渲染当前模式
    this._renderMindmapContent();
  },

  _renderMindmapContent() {
    const container = document.getElementById('mindmapCanvasContainer');
    if (!container) return;

    if (this.mindmapMode === 'collab') {
      this._renderCollaborativeMindmap(container);
    } else {
      this._renderClassicMindmap(container);
    }
  },

  _renderCollaborativeMindmap(container) {
    const data = EMOTION_MAP;
    const centerImg = IMAGERIES.find(i => i.name === data.center);
    const room = this.mindmapRoom || 'group_1';

    // 准备预设节点（中心意象 + 分支诗词）
    const presetNodes = [
      { name: data.center, emoji: centerImg?.emoji || '🌙', x: 400, y: 250, color: '#2D5A27', isCenter: true },
      ...this.mindmapNodes.map(n => ({
        name: n.name, emoji: n.emoji, x: n.x, y: n.y, color: n.color
      }))
    ];

    // 显示协作控件
    document.getElementById('mindmapGroupSelect').style.display = 'inline-block';
    document.getElementById('mindmapConnStatus').style.display = 'inline';
    document.getElementById('mindmapModeBtn').textContent = '📋 返回经典模式';

    // 创建Canvas
    container.innerHTML = '<canvas id="wbCanvas"></canvas>';
    const canvasEl = document.getElementById('wbCanvas');
    if (canvasEl) {
      canvasEl.style.width = '100%';
      canvasEl.style.height = '100%';
      canvasEl.width = container.offsetWidth;
      canvasEl.height = container.offsetHeight;
    }

    // 初始化协作白板
    setTimeout(() => {
      Whiteboard.init('wbCanvas', room, {
        role: this.currentUser?.role || 'student',
        username: this.currentUser?.name || '学生',
        presetNodes: presetNodes,
      });

      // 设置工具栏
      Whiteboard.setToolbar('mindmapToolbarContainer');

      // 更新连接状态
      const statusEl = document.getElementById('mindmapConnStatus');
      if (statusEl) statusEl.textContent = '🟢 协作中 · 房间: ' + room;
    }, 300);
  },

  _renderClassicMindmap(container) {
    const data = EMOTION_MAP;
    const centerImg = IMAGERIES.find(i => i.name === data.center);

    // 隐藏协作控件
    const groupSelect = document.getElementById('mindmapGroupSelect');
    const connStatus = document.getElementById('mindmapConnStatus');
    const modeBtn = document.getElementById('mindmapModeBtn');
    if (groupSelect) groupSelect.style.display = 'none';
    if (connStatus) connStatus.style.display = 'none';
    if (modeBtn) modeBtn.textContent = '🎨 协作画布（可选）';
    document.getElementById('mindmapToolbarContainer').innerHTML = '';

    const renderNodes = () => {
      return this.mindmapNodes.map((n, i) => `
        <div class="mindmap-node draggable-node" id="mindmapNode${i}"
             style="position:absolute;left:${n.x}px;top:${n.y}px;transform:translate(-50%,-50%);border-color:${n.color};cursor:grab"
             ondblclick="App.editMindmapNode(${i})"
             onmousedown="App.startDragNode(event, ${i})">
          <div style="color:${n.color}">${n.emoji}</div>
          <div class="poem">《${n.poem}》</div>
          <div style="font-size:11px;color:var(--text-secondary)">${n.author}</div>
          <div class="emotion" style="color:${n.color};font-weight:600">${n.emotion}</div>
        </div>
      `).join('');
    };

    const renderLines = () => {
      const cx = 250, cy = 230;
      return this.mindmapNodes.map(n => {
        const dx = n.x - cx, dy = n.y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const nx = dx/dist, ny = dy/dist;
        const x1 = cx + nx*60, y1 = cy + ny*60;
        const x2 = n.x - nx*50, y2 = n.y - ny*50;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${n.color}" stroke-width="2" stroke-dasharray="6,3" opacity="0.5"/>`;
      }).join('');
    };

    container.innerHTML = `
      <div class="mindmap-container" id="mindmapCanvas"
           style="position:relative;overflow:hidden;height:100%"
           onmousemove="App.dragNode(event)" onmouseup="App.stopDragNode()" onmouseleave="App.stopDragNode()">
        <div class="mindmap-center" style="position:absolute;top:230px;left:250px;transform:translate(-50%,-50%);z-index:10">
          ${centerImg ? centerImg.emoji : '🌙'}
          <span style="font-size:20px;font-weight:700">${data.center}</span>
          <div class="label">核心意象</div>
        </div>
        <div id="mindmapNodesContainer">${renderNodes()}</div>
        <svg id="mindmapSvg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1">
          ${renderLines()}
        </svg>
      </div>
    `;
  },

  toggleMindmapMode() {
    if (this.mindmapMode === 'classic') {
      this.mindmapMode = 'collab';
      this.mindmapRoom = this.mindmapRoom || 'group_1';
    } else {
      // 销毁协作白板
      Whiteboard.destroy();
      this.mindmapMode = 'classic';
    }
    this._renderMindmapContent();
  },

  switchMindmapRoom() {
    const select = document.getElementById('mindmapGroupSelect');
    if (!select) return;
    const newRoom = select.value;
    if (newRoom === this.mindmapRoom) return;
    Whiteboard.destroy();
    this.mindmapRoom = newRoom;
    const container = document.getElementById('mindmapCanvasContainer');
    if (container) this._renderCollaborativeMindmap(container);
  },

  joinMindmapRoom(room) {
    if (this.currentPage !== 'mindmap') {
      // 切换到意象情感地图页面
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      const nav = document.querySelector('[data-page="mindmap"]');
      if (nav) nav.classList.add('active');
      this.currentPage = 'mindmap';
      const main = document.getElementById('mainContent');
      this.renderMindmap(main);
    }
    this.mindmapMode = 'collab';
    this.mindmapRoom = room;
    setTimeout(() => this._renderMindmapContent(), 100);
  },

  startDragNode(e, idx) {
    e.preventDefault();
    const node = this.mindmapNodes[idx];
    const rect = e.target.closest('.mindmap-node').getBoundingClientRect();
    this.mindmapDragging = idx;
    this.mindmapDragOffset = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };
  },

  dragNode(e) {
    if (this.mindmapDragging === null) return;
    e.preventDefault();
    const canvas = document.getElementById('mindmapCanvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - this.mindmapDragOffset.x;
    const y = e.clientY - rect.top - this.mindmapDragOffset.y;
    // Clamp within canvas
    const cx = Math.max(30, Math.min(rect.width - 30, x));
    const cy = Math.max(30, Math.min(460, y));
    this.mindmapNodes[this.mindmapDragging].x = cx;
    this.mindmapNodes[this.mindmapDragging].y = cy;

    // Update node position
    const nodeEl = document.getElementById('mindmapNode' + this.mindmapDragging);
    if (nodeEl) {
      nodeEl.style.left = cx + 'px';
      nodeEl.style.top = cy + 'px';
    }

    // Update SVG lines
    const svg = document.getElementById('mindmapSvg');
    if (svg) {
      const cx2 = 250, cy2 = 230;
      svg.innerHTML = this.mindmapNodes.map(n => {
        const dx = n.x - cx2, dy = n.y - cy2;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const nx = dx/dist, ny = dy/dist;
        const x1 = cx2 + nx * 60, y1 = cy2 + ny * 60;
        const x2 = n.x - nx * 50, y2 = n.y - ny * 50;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${n.color}" stroke-width="2" stroke-dasharray="6,3" opacity="0.5"/>`;
      }).join('');
    }
  },

  stopDragNode() {
    this.mindmapDragging = null;
  },

  editMindmapNode(idx) {
    const node = this.mindmapNodes[idx];
    const newPoem = prompt('编辑诗篇名称：', node.poem);
    if (newPoem) node.poem = newPoem;
    const newEmotion = prompt('编辑情感标签：', node.emotion);
    if (newEmotion) node.emotion = newEmotion;
    // Re-render to update
    const container = document.getElementById('mindmapNodesContainer');
    if (container) {
      container.innerHTML = this.mindmapNodes.map((n, i) => `
        <div class="mindmap-node draggable-node" id="mindmapNode${i}"
             style="position:absolute;left:${n.x}px;top:${n.y}px;transform:translate(-50%,-50%);border-color:${n.color};cursor:grab"
             ondblclick="App.editMindmapNode(${i})"
             onmousedown="App.startDragNode(event, ${i})">
          <div style="color:${n.color}">${IMAGERIES.find(img => img.poems.some(p => p.title === n.poem))?.emoji || '📜'}</div>
          <div class="poem">《${n.poem}》</div>
          <div style="font-size:11px;color:var(--text-secondary)">${n.author}</div>
          <div class="emotion" style="color:${n.color};font-weight:600">${n.emotion}</div>
        </div>
      `).join('');
    }
  },

  addMindmapBranch() {
    const poem = prompt('请输入诗篇名称（如：静夜思）：', '');
    if (!poem) return;
    const author = prompt('请输入作者：', '李白');
    const emotion = prompt('请输入情感标签：', '思乡');
    const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

    this.mindmapNodes.push({
      id: this.mindmapNodes.length,
      poem, author, emotion, color,
      x: 250 + (Math.random() - 0.5) * 300,
      y: 230 + (Math.random() - 0.5) * 300
    });

    // Re-render
    this.renderPage('mindmap');
  },

  resetMindmapLayout() {
    const data = EMOTION_MAP;
    this.mindmapNodes = data.branches.map((b, i) => {
      const angles = [0, 90, 180, 270];
      const angle = angles[i] * Math.PI / 180;
      const r = 160;
      return {
        id: i, poem: b.poem, author: b.author, emotion: b.emotion, color: b.color,
        x: 250 + r * Math.cos(angle),
        y: 230 + r * Math.sin(angle)
      };
    });
    this.renderPage('mindmap');
  },

  // ==========================================
  // 7. 诗歌鉴赏实战
  // ==========================================
  renderPractice(main) {
    const poem = PRACTICE_POEMS[0];

    main.innerHTML = `
      <div class="page-header">
        <h2>✍️ 诗歌鉴赏实战</h2>
        <p>教师示范 → 迁移应用 | 找意象 → 析意境 → 悟情感 → 组织答案</p>
      </div>

      <div class="card">
        <div class="card-title">👩‍🏫 教师示范：《${poem.title}》 ${poem.author}</div>
        <div style="font-size:18px;line-height:2;padding:20px;background:var(--bg);border-radius:10px;text-align:center;font-style:italic;margin-bottom:20px">
          ${poem.content.replace(/。/g, '。<br>')}
        </div>

        <div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px;flex-wrap:wrap">
          <div style="text-align:center">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 8px">1</div>
            <div style="font-weight:700">找意象</div>
            <div style="font-size:12px;color:var(--text-secondary)">↓</div>
          </div>
          <div style="text-align:center">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--info);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 8px">2</div>
            <div style="font-weight:700">析意境</div>
            <div style="font-size:12px;color:var(--text-secondary)">↓</div>
          </div>
          <div style="text-align:center">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--warning);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 8px">3</div>
            <div style="font-weight:700">悟情感</div>
            <div style="font-size:12px;color:var(--text-secondary)">↓</div>
          </div>
          <div style="text-align:center">
            <div style="width:80px;height:80px;border-radius:50%;background:var(--success);color:white;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto 8px">4</div>
            <div style="font-weight:700">组织答案</div>
          </div>
        </div>

        <div style="padding:16px;background:var(--bg);border-radius:10px;margin-bottom:12px">
          <strong>🔍 意象清单：</strong>
          ${poem.analysis.imageries.map(i => `<span class="tag tag-primary" style="margin:4px">${i}</span>`).join('')}
        </div>
        <div style="padding:16px;background:var(--bg);border-radius:10px;margin-bottom:12px">
          <strong>🌄 意境：</strong>${poem.analysis.mood}
        </div>
        <div style="padding:16px;background:var(--bg);border-radius:10px;margin-bottom:12px">
          <strong>💭 情感：</strong>${poem.analysis.emotion}
        </div>
        <div style="padding:16px;background:rgba(16,185,129,0.08);border-radius:10px;border-left:4px solid var(--success)">
          <strong>✅ 规范答题模板：</strong><br>
          <span style="font-size:15px;font-weight:600;color:var(--primary)">${poem.template}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📝 迁移应用：自主鉴赏</div>
        ${PRACTICE_POEMS.slice(1).map((p, idx) => `
          <div style="margin-bottom:20px;padding:16px;background:var(--bg);border-radius:10px">
            <h4 style="margin-bottom:8px">题目 ${idx+1}：《${p.title}》${p.author}</h4>
            <p style="font-style:italic;margin-bottom:12px">${p.content}</p>
            <div class="form-group"><label>请找出诗歌中的意象：</label><input class="form-input" placeholder="输入意象，用顿号分隔"></div>
            <div class="form-group"><label>概括意境：</label><input class="form-input" placeholder="例如：雄浑壮阔"></div>
            <div class="form-group"><label>分析情感：</label><input class="form-input" placeholder="例如：不畏艰难的豪情壮志"></div>
            <div class="form-group"><label>组织答题表述：</label><textarea class="form-textarea" placeholder="${ANSWER_TEMPLATE}"></textarea></div>
            <button class="btn btn-accent btn-sm" onclick="App.revealAnswer(${idx+1})">查看参考 →</button>
            <div id="reveal_${idx+1}" style="display:none;margin-top:12px;padding:12px;background:rgba(16,185,129,0.08);border-radius:8px">
              <strong>参考答案：</strong>诗人通过"${p.analysis.imageries.join('、')}"等意象，营造出"${p.analysis.mood}"的意境，表达了"${p.analysis.emotion}"。
            </div>
          </div>
        `).join('')}
      </div>
      <div class="banner banner-success">
        💡 答题模板：${ANSWER_TEMPLATE}
      </div>
    `;
  },

  revealAnswer(idx) {
    const el = document.getElementById(`reveal_${idx}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  // ==========================================
  // 8. 情感辨析练习
  // ==========================================
  renderHomework(main) {
    main.innerHTML = `
      <div class="page-header">
        <h2>📝 情感辨析练习</h2>
        <p>课后线上练习 | 判断意象、意境、情感类型</p>
      </div>
      ${HOMEWORK_POEMS.map((p, idx) => `
        <div class="card">
          <div class="card-title" style="justify-content:space-between">
            <span>题目 ${idx + 1}：${p.title} · ${p.author}</span>
            <span class="tag tag-info">课后练习</span>
          </div>
          <div style="font-size:18px;line-height:2;padding:20px;background:var(--bg);border-radius:10px;text-align:center;font-style:italic;margin-bottom:20px">
            ${p.content}
          </div>

          <div class="grid-3" style="margin-bottom:16px">
            <div class="form-group">
              <label>🔍 找出诗歌中的意象</label>
              <input class="form-input homework-input" data-qid="h${idx}_img" placeholder="请填写意象，用顿号分隔">
            </div>
            <div class="form-group">
              <label>🌄 分析诗歌的意境</label>
              <input class="form-input homework-input" data-qid="h${idx}_mood" placeholder="例如：清冷孤寂">
            </div>
            <div class="form-group">
              <label>💭 概括诗歌的情感</label>
              <input class="form-input homework-input" data-qid="h${idx}_emo" placeholder="例如：羁旅之愁">
            </div>
          </div>

          <div style="display:flex;gap:12px;align-items:center">
            <button class="btn btn-accent" onclick="App.checkHomework(${idx})">✅ 提交答案</button>
            <button class="btn btn-outline" onclick="App.showHomeworkHint(${idx})">💡 查看提示</button>
            <span id="homeworkFeedback_${idx}" style="font-size:14px;font-weight:600"></span>
          </div>
          <div id="homeworkHint_${idx}" style="display:none;margin-top:12px;padding:16px;background:rgba(59,130,246,0.06);border-radius:10px;border-left:4px solid var(--info)">
            <strong>参考答案：</strong>意象：${p.questions.imageries} | 意境：${p.questions.mood} | 情感：${p.questions.emotion}
          </div>
        </div>
      `).join('')}

      <div class="card" style="text-align:center;background:linear-gradient(135deg, rgba(45,90,39,0.05), rgba(212,168,83,0.08))">
        <h3 style="margin-bottom:8px">🎯 答题提示</h3>
        <p style="color:var(--text-secondary)">回忆课堂四步法：<strong>找意象 → 析意境 → 悟情感 → 组织答案</strong></p>
        <p style="color:var(--text-secondary);margin-top:4px">模板：${ANSWER_TEMPLATE}</p>
      </div>
    `;
  },

  checkHomework(idx) {
    const poem = HOMEWORK_POEMS[idx];
    const imgEl = document.querySelector(`[data-qid="h${idx}_img"]`);
    const moodEl = document.querySelector(`[data-qid="h${idx}_mood"]`);
    const emoEl = document.querySelector(`[data-qid="h${idx}_emo"]`);
    const feedback = document.getElementById(`homeworkFeedback_${idx}`);

    const userImg = imgEl.value.trim();
    const userMood = moodEl.value.trim();
    const userEmo = emoEl.value.trim();

    if (!userImg || !userMood || !userEmo) {
      feedback.innerHTML = '<span style="color:var(--warning)">⚠️ 请填写所有字段后再提交</span>';
      return;
    }

    // 简单的相似度检查
    const correctImg = poem.questions.imageries;
    const correctMood = poem.questions.mood;
    const correctEmo = poem.questions.emotion;
    let score = 0;
    const checks = [];

    // 检查意象（用户至少写出部分核心意象）
    const userImgs = userImg.replace(/[，,、]/g, ' ').split(/\s+/).filter(Boolean);
    const correctImgs = correctImg.replace(/[，,、]/g, ' ').split(/\s+/).filter(Boolean);
    const imgMatch = userImgs.filter(ui => correctImgs.some(ci => ci.includes(ui) || ui.includes(ci)));
    if (imgMatch.length >= correctImgs.length * 0.4) { score++; checks.push('意象 ✓'); } else { checks.push('意象 ✗'); }

    // 检查意境（关键词匹配）
    if (userMood.includes(correctMood) || correctMood.includes(userMood) ||
        correctMood.split('').some(c => userMood.includes(c))) { score++; checks.push('意境 ✓'); } else { checks.push('意境 需改进'); }

    // 检查情感（关键词匹配）
    if (userEmo.includes(correctEmo) || correctEmo.includes(userEmo) ||
        correctEmo.split('').some(c => userEmo.includes(c))) { score++; checks.push('情感 ✓'); } else { checks.push('情感 需改进'); }

    if (score === 3) {
      feedback.innerHTML = '<span style="color:var(--success)">🎉 太棒了！三项全对！</span>';
    } else if (score >= 1) {
      feedback.innerHTML = `<span style="color:var(--warning)">📝 部分正确（${score}/3）。${checks.join(' | ')}。再看看参考答案吧！</span>`;
    } else {
      feedback.innerHTML = '<span style="color:var(--danger)">💪 还需要练习哦。点击"查看提示"看看参考答案吧！</span>';
    }
  },

  showHomeworkHint(idx) {
    const el = document.getElementById(`homeworkHint_${idx}`);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  // ==========================================
  // 9. AI诗词海报创作
  // ==========================================
  renderPoster(main) {
    this.posterStep = 1;
    this.posterData = { poem: null, analysis: {}, prompt: '', imageUrl: null, appreciation: '' };

    // 收集所有诗歌作为候选
    const allPoems = [];
    IMAGERIES.forEach(img => {
      img.poems.forEach(p => {
        if (!allPoems.find(ap => ap.title === p.title)) {
          allPoems.push({ ...p, imagery: img.name, imageryEmoji: img.emoji });
        }
      });
    });

    main.innerHTML = `
      <div class="page-header">
        <h2>🎨 AI诗词海报创作</h2>
        <p>选择诗词 → 生成提示词 → AI生成图像 → 撰写赏析 | 四步完成海报创作</p>
      </div>

      <!-- 步骤指示器 -->
      <div class="steps">
        <div class="step active" id="step1">
          <div class="step-num">1</div>
          <span>选择诗歌</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="step" id="step2">
          <div class="step-num">2</div>
          <span>生成提示词</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="step" id="step3">
          <div class="step-num">3</div>
          <span>AI生成图像</span>
        </div>
        <span class="step-arrow">→</span>
        <div class="step" id="step4">
          <div class="step-num">4</div>
          <span>撰写赏析</span>
        </div>
      </div>

      <!-- 步骤1：选诗歌 -->
      <div class="card" id="posterStep1Content">
        <div class="card-title">📜 第一步：选择一首你喜欢的诗词</div>
        <div class="grid-2">
          ${allPoems.map(p => `
            <div class="poster-poem-card" onclick="App.selectPosterPoem('${p.title}', '${p.author}', '${p.imageryEmoji}')"
                 style="padding:20px;background:var(--bg);border-radius:12px;cursor:pointer;border:2px solid var(--border);transition:var(--transition)"
                 onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size:24px;margin-bottom:8px">${p.imageryEmoji}</div>
              <div style="font-weight:700;font-size:16px">《${p.title}》</div>
              <div style="color:var(--text-secondary);font-size:13px;margin-bottom:8px">${p.author}</div>
              <div style="font-style:italic;font-size:13px;color:var(--text-secondary);line-height:1.6">"${p.verse}"</div>
              <div style="margin-top:8px"><span class="tag tag-primary">${p.imagery}</span> <span class="tag tag-accent">${p.emotion}</span></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 步骤2：生成提示词 -->
      <div class="card" id="posterStep2Content" style="display:none">
        <div class="card-title">✍️ 第二步：生成AI绘画提示词</div>
        <p style="color:var(--text-secondary);margin-bottom:16px">基于你选择的诗歌，描述画面元素、风格、色调和氛围</p>

        <div id="posterSelectedPoem" style="padding:16px;background:var(--bg);border-radius:10px;margin-bottom:16px"></div>

        <div class="form-group">
          <label>🖼️ 画面元素（景、物、人）</label>
          <input class="form-input" id="posterElements" placeholder="例如：明月、窗前、远山、江流">
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>🎨 绘画风格</label>
            <input class="form-input" id="posterStyle" placeholder="例如：中国传统水墨画风" value="中国传统水墨画风">
          </div>
          <div class="form-group">
            <label>🌈 色调氛围</label>
            <input class="form-input" id="posterTone" placeholder="例如：清冷朦胧、蓝灰调" value="淡雅素净">
          </div>
        </div>
        <div class="form-group">
          <label>📝 AI提示词预览</label>
          <textarea class="form-textarea" id="posterPromptPreview" rows="3" readonly style="background:var(--bg);font-size:13px"></textarea>
        </div>
        <div style="display:flex;gap:12px">
          <button class="btn btn-primary" onclick="App.generatePrompt()">🔄 生成提示词</button>
          <button class="btn btn-outline" onclick="App.goToPosterStep(1)">⬅️ 返回上一步</button>
          <button class="btn btn-accent" id="posterGoStep3" style="display:none" onclick="App.goToPosterStep(3)">下一步 ➡️</button>
        </div>
      </div>

      <!-- 步骤3：AI生成图像 -->
      <div class="card" id="posterStep3Content" style="display:none">
        <div class="card-title">🤖 第三步：AI生成诗词图像</div>
        <p style="color:var(--text-secondary);margin-bottom:16px">将提示词发送给AI文生图模型，生成海报图像</p>

        <div style="padding:16px;background:var(--bg);border-radius:10px;margin-bottom:16px">
          <strong>当前提示词：</strong><br>
          <span id="posterFinalPrompt" style="font-size:14px;color:var(--text-secondary)"></span>
        </div>

        <div class="poster-image" id="posterGenPreview" style="height:320px;border-radius:12px">
          <div style="text-align:center">
            <div style="font-size:64px;margin-bottom:12px">🤖</div>
            <p style="font-size:16px;margin-bottom:8px">AI已就绪，点击按钮生成海报</p>
            <p style="font-size:13px;opacity:0.7">基于你的提示词生成诗词意境图</p>
          </div>
        </div>

        <div style="margin-top:16px;display:flex;gap:12px">
          <button class="btn btn-accent" onclick="App.generatePosterImage()">🎨 生成图像</button>
          <button class="btn btn-outline" onclick="App.goToPosterStep(2)">⬅️ 返回上一步</button>
          <button class="btn btn-primary" id="posterGoStep4" style="display:none" onclick="App.goToPosterStep(4)">下一步 ➡️</button>
        </div>
      </div>

      <!-- 步骤4：撰写赏析 -->
      <div class="card" id="posterStep4Content" style="display:none">
        <div class="card-title">📝 第四步：撰写诗歌赏析</div>
        <p style="color:var(--text-secondary);margin-bottom:16px">梳理意象、意境和情感，完成赏析文字</p>

        <div class="form-group">
          <label>🔍 意象分析</label>
          <textarea class="form-textarea" id="posterImageryAnalysis" placeholder="诗歌中出现了哪些意象？它们分别有什么特点？" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>🌄 意境描述</label>
          <textarea class="form-textarea" id="posterMoodAnalysis" placeholder="这些意象共同营造了怎样的意境？" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>💭 情感感悟</label>
          <textarea class="form-textarea" id="posterEmotionAnalysis" placeholder="诗人通过这些意象表达了怎样的情感？" rows="3"></textarea>
        </div>
        <div class="form-group">
          <label>✍️ 完整赏析文字（将显示在海报上）</label>
          <textarea class="form-textarea" id="posterFullAppreciation" rows="4" placeholder="综合以上分析，写一段完整的赏析文字"></textarea>
        </div>

        <div style="display:flex;gap:12px">
          <button class="btn btn-primary" onclick="App.submitPoster()">🎉 完成海报创作</button>
          <button class="btn btn-outline" onclick="App.goToPosterStep(3)">⬅️ 返回上一步</button>
        </div>
      </div>

      <div class="banner banner-info">
        💡 结合课堂所学四步法：<strong>找意象 → 析意境 → 悟情感 → 组织答案</strong>，为你的海报写一段精彩的赏析。
      </div>
    `;
  },

  selectPosterPoem(title, author, emoji) {
    // 从 IMAGERIES 中找到完整诗歌信息
    let verse = '';
    IMAGERIES.forEach(img => {
      img.poems.forEach(p => {
        if (p.title === title) verse = p.verse;
      });
    });

    this.posterData.poem = { title, author, emoji, verse };
    // 高亮选中
    document.querySelectorAll('.poster-poem-card').forEach(card => {
      card.style.borderColor = 'var(--border)';
      card.style.background = 'var(--bg)';
    });
    event.target.closest('.poster-poem-card').style.borderColor = 'var(--primary)';
    event.target.closest('.poster-poem-card').style.background = 'rgba(45,90,39,0.05)';

    document.getElementById('posterSelectedPoem').innerHTML = `
      <strong style="font-size:16px">${emoji} 《${title}》 — ${author}</strong>
      <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;font-style:italic">"${verse}"</div>
    `;

    // 自动跳转到步骤2
    setTimeout(() => this.goToPosterStep(2), 400);
  },

  goToPosterStep(step) {
    this.posterStep = step;
    // 更新步骤指示器样式
    for (let i = 1; i <= 4; i++) {
      const stepEl = document.getElementById(`step${i}`);
      stepEl.classList.remove('active', 'completed');
      if (i < step) stepEl.classList.add('completed');
      if (i === step) stepEl.classList.add('active');
    }
    // 显示/隐藏步骤内容
    for (let i = 1; i <= 4; i++) {
      const content = document.getElementById(`posterStep${i}Content`);
      if (content) content.style.display = i === step ? '' : 'none';
    }
    // 进入步骤3时同步提示词
    if (step === 3) {
      const finalPrompt = document.getElementById('posterFinalPrompt');
      if (finalPrompt) finalPrompt.textContent = this.posterData.prompt || '（请先在步骤2中生成提示词）';
    }
  },

  generatePrompt() {
    const elements = document.getElementById('posterElements').value.trim();
    const style = document.getElementById('posterStyle').value.trim() || '中国传统水墨画风';
    const tone = document.getElementById('posterTone').value.trim() || '淡雅素净';
    const poem = this.posterData.poem;

    if (!elements) {
      alert('请先填写画面元素');
      return;
    }

    const prompt = `${elements}，${style}，${tone}色调，诗词意境插画，${poem ? `表现《${poem.title}》诗意` : ''}，高清，细腻笔触，留白构图`;
    document.getElementById('posterPromptPreview').value = prompt;
    this.posterData.prompt = prompt;
    document.getElementById('posterGoStep3').style.display = 'inline-flex';
  },

  generatePosterImage() {
    if (!this.posterData.prompt) {
      alert('请先在步骤2中生成提示词');
      return;
    }

    const preview = document.getElementById('posterGenPreview');
    const genBtn = document.querySelector('#posterStep3Content .btn-accent');
    if (genBtn) genBtn.disabled = true;

    preview.innerHTML = `
      <div style="text-align:center;padding:40px">
        <div style="font-size:48px;margin-bottom:16px;animation:pulse 1.5s infinite">⏳</div>
        <p style="font-size:16px;margin-bottom:8px;font-weight:600">豆包AI正在创作中...</p>
        <p style="font-size:13px;opacity:0.7">提示词：${this.posterData.prompt.substring(0, 60)}...</p>
        <p style="font-size:12px;opacity:0.5;margin-top:8px">预计需 5~15 秒，请耐心等待</p>
      </div>
    `;

    // 调用豆包AI文生图API
    fetch(API + '/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: this.posterData.prompt, size: '2K' })
    })
    .then(res => res.json())
    .then(data => {
      if (genBtn) genBtn.disabled = false;
      if (data.success && data.url) {
        this.posterData.imageUrl = data.url;
        preview.innerHTML = `
          <img src="${data.url}" alt="AI生成海报"
               style="width:100%;height:100%;object-fit:cover;border-radius:12px"
               onerror="this.parentElement.innerHTML='<div style=\\'text-align:center;padding:40px\\'><p style=\\'color:var(--danger)\\'>图像加载失败，请重试</p></div>'">
        `;
        document.getElementById('posterGoStep4').style.display = 'inline-flex';
      } else {
        throw new Error(data.error || '未知错误');
      }
    })
    .catch(err => {
      if (genBtn) genBtn.disabled = false;
      preview.innerHTML = `
        <div style="text-align:center;padding:40px">
          <div style="font-size:48px;margin-bottom:12px">❌</div>
          <p style="font-size:16px;margin-bottom:8px;color:var(--danger)">生成失败</p>
          <p style="font-size:13px;opacity:0.7">${err.message}</p>
          <button class="btn btn-accent btn-sm" style="margin-top:12px" onclick="App.generatePosterImage()">🔄 重试</button>
        </div>
      `;
    });
  },

  async submitPoster() {
    const imagery = document.getElementById('posterImageryAnalysis').value.trim();
    const mood = document.getElementById('posterMoodAnalysis').value.trim();
    const emotion = document.getElementById('posterEmotionAnalysis').value.trim();
    const full = document.getElementById('posterFullAppreciation').value.trim();

    if (!full) { alert('请填写完整赏析文字'); return; }

    this.posterData.appreciation = full;

    const poem = this.posterData.poem;
    const student = App.currentUser?.name || '匿名学生';

    const submitBtn = document.querySelector('#posterStep4Content .btn-accent') || document.querySelector('#posterStep4Content button');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '提交中...'; }

    // 提交到 Vika 作品墙
    const result = await VikaAPI.submitGallery(
      student,
      poem ? poem.title : '未知',
      poem ? poem.author : '未知',
      poem ? (poem.content || poem.verse || '') : '',
      this.posterData.prompt || '',
      full
    );

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '发布到作品墙'; }

    if (result && result.success) {
      // 同步到本地数组以便立即展示
      const newWork = {
        id: 'g' + Date.now(),
        studentName: student,
        poem: poem ? poem.title : '未知',
        author: poem ? poem.author : '未知',
        imagePrompt: this.posterData.prompt,
        imageUrl: this.posterData.imageUrl || '',
        appreciation: full,
        likes: 0
      };
      GALLERY_WORKS.unshift(newWork);
      alert('🎉 海报创作完成！已发布到班级作品墙。');
      this.renderPage('gallery');
    } else {
      // 降级：本地保存并提示
      const newWork = {
        id: 'g' + Date.now(),
        studentName: student,
        poem: poem ? poem.title : '未知',
        author: poem ? poem.author : '未知',
        imagePrompt: this.posterData.prompt,
        imageUrl: this.posterData.imageUrl || '',
        appreciation: full,
        likes: 0
      };
      GALLERY_WORKS.unshift(newWork);
      alert('⚠️ 已本地保存（网络提交失败：' + (result?.message || result?.error || '服务器未启动') + '）');
      this.renderPage('gallery');
    }
  },

  // ==========================================
  // 10. AI意境短片（课后拓展）
  // ==========================================
  renderAIScene(main) {
    // 收集所有可用的诗歌
    const allPoems = [];
    IMAGERIES.forEach(img => {
      img.poems.forEach(p => {
        if (!allPoems.find(ap => ap.title === p.title)) {
          allPoems.push({ ...p, imagery: img.name, imageryEmoji: img.emoji });
        }
      });
    });

    main.innerHTML = `
      <div class="page-header">
        <h2>🎬 AI意境短片</h2>
        <p>选择一首诗词，让AI生成意境动画，感受意象组合营造的整体氛围</p>
      </div>

      <div class="card">
        <div class="card-title">📜 选择诗词</div>
        <div class="grid-2" style="margin-bottom:16px">
          ${allPoems.slice(0, 8).map(p => `
            <div class="poster-poem-card" onclick="App.selectScenePoem('${p.title}', '${p.author}', '${p.imageryEmoji}', '${p.verse.replace(/'/g, "\\'")}', '${p.emotion}')"
                 style="padding:16px;background:var(--bg);border-radius:12px;cursor:pointer;border:2px solid var(--border);transition:var(--transition)"
                 onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="font-size:20px;margin-bottom:4px">${p.imageryEmoji}</div>
              <div style="font-weight:700;font-size:15px">《${p.title}》</div>
              <div style="color:var(--text-secondary);font-size:12px">${p.author}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;font-style:italic">"${p.verse.substring(0, 20)}..."</div>
              <div style="margin-top:4px"><span class="tag tag-accent">${p.emotion}</span></div>
            </div>
          `).join('')}
        </div>
        <p style="color:var(--text-secondary);font-size:13px">🖱️ 点击诗歌卡片选中，然后点击下方按钮生成意境动画</p>
      </div>

      <!-- 已选中诗歌预览 -->
      <div class="card" id="sceneSelectedCard" style="display:none">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
          <div style="font-size:40px" id="sceneSelectedEmoji"></div>
          <div>
            <div style="font-weight:700;font-size:18px" id="sceneSelectedTitle"></div>
            <div style="color:var(--text-secondary);font-size:14px" id="sceneSelectedInfo"></div>
          </div>
          <button class="btn btn-accent" style="margin-left:auto" onclick="App.generateSceneImage()" id="sceneGenerateBtn">
            🤖 AI生成意境画面
          </button>
        </div>

        <!-- 动画展示区 -->
        <div id="sceneAnimationArea" style="position:relative;background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:12px;min-height:360px;display:flex;align-items:center;justify-content:center;color:white">
          <div style="text-align:center" id="scenePlaceholder">
            <div style="font-size:64px;margin-bottom:12px">🎬</div>
            <p style="font-size:16px">AI意境短片生成区</p>
            <p style="font-size:13px;opacity:0.6">选中诗歌后点击上方按钮生成</p>
          </div>
        </div>
      </div>

      <div class="banner banner-info" style="margin-top:16px">
        💡 <strong>教学提示：</strong>观察AI生成的意境画面，思考：这些意象如何组合成整体画面？画面传递了怎样的情感氛围？
      </div>
    `;
  },

  selectScenePoem(title, author, emoji, verse, emotion) {
    this.sceneData = { title, author, emoji, verse, emotion };
    // 高亮选中
    document.querySelectorAll('.poster-poem-card').forEach(card => {
      card.style.borderColor = 'var(--border)';
      card.style.background = 'var(--bg)';
    });
    if (event && event.target) {
      const card = event.target.closest('.poster-poem-card');
      if (card) {
        card.style.borderColor = 'var(--primary)';
        card.style.background = 'rgba(45,90,39,0.05)';
      }
    }

    // 显示选中区域
    const card = document.getElementById('sceneSelectedCard');
    if (card) card.style.display = '';
    document.getElementById('sceneSelectedEmoji').textContent = emoji;
    document.getElementById('sceneSelectedTitle').textContent = `《${title}》`;
    document.getElementById('sceneSelectedInfo').textContent = `${author} | ${emotion}`;
  },

  async generateSceneImage() {
    if (!this.sceneData) {
      alert('请先在诗歌列表中选择一首诗词');
      return;
    }

    const { title, author, verse, emotion } = this.sceneData;
    const btn = document.getElementById('sceneGenerateBtn');
    const area = document.getElementById('sceneAnimationArea');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ 生成中...'; }

    // 根据诗歌构建提示词
    const prompts = {
      '静夜思': '明月高悬夜空，银色月光洒落庭院，一人独坐窗前遥望远方，中国风水墨画风格，思乡意境',
      '天净沙·秋思': '秋日黄昏，枯藤缠绕老树，昏鸦栖息，远处小桥流水，荒凉古道延伸，萧瑟苍茫',
      '水调歌头': '明月当空，把酒问天，琼楼玉宇，清辉遍洒，中国风水墨画风格，旷达超然',
      '江雪': '寒江孤舟，老翁独钓，漫天飞雪，千山寂静，中国风水墨画风格，清冷孤高',
    };
    const prompt = prompts[title] || `${verse}，${emotion}意境，中国风水墨画风格，淡雅素净`;

    // 显示加载状态
    if (area) {
      area.innerHTML = `
        <div class="video-spinner">
          <div class="spinner-ring"></div>
          <p>🤖 AI正在生成意境画面...</p>
          <p style="font-size:12px;opacity:0.6;margin-top:4px">《${title}》— ${author}</p>
        </div>
      `;
    }

    try {
      const res = await fetch(API + '/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, poem: verse, author, style: 'chinese_ink' })
      });
      const data = await res.json();

      if (btn) { btn.disabled = false; btn.textContent = '🤖 AI生成意境画面'; }

      if (data.success && data.image_url) {
        if (area) {
          area.innerHTML = `
            <div class="video-animation-container" style="height:400px">
              <div class="video-animation-bg" style="background-image:url('${data.image_url}')"></div>
              <div class="video-overlay">
                <div class="poem-title">《${title}》</div>
                <div class="poem-author">—— ${author}</div>
                <p style="margin-top:8px;font-size:14px;opacity:0.9">${verse}</p>
                <p style="font-size:12px;opacity:0.7;margin-top:4px">情感：${emotion}</p>
              </div>
            </div>
          `;
        }
      } else {
        if (area) {
          area.innerHTML = `
            <div style="padding:40px;text-align:center">
              <div style="font-size:48px;margin-bottom:12px">🎬</div>
              <p>AI意境图生成中，请稍后重试</p>
              <p style="font-size:12px;opacity:0.6;margin-top:4px">${data.error || '服务暂不可用'}</p>
              <button class="btn btn-accent btn-sm" style="margin-top:12px" onclick="App.generateSceneImage()">🔄 重试</button>
            </div>
          `;
        }
      }
    } catch (e) {
      console.warn('[AI短片] 请求失败:', e.message);
      if (btn) { btn.disabled = false; btn.textContent = '🤖 AI生成意境画面'; }
      if (area) {
        area.innerHTML = `
          <div style="padding:40px;text-align:center">
            <div style="font-size:48px;margin-bottom:12px">🎬</div>
            <p>网络异常，请检查后端服务器是否启动</p>
            <button class="btn btn-accent btn-sm" style="margin-top:12px" onclick="App.generateSceneImage()">🔄 重试</button>
          </div>
        `;
      }
    }
  },

  // ==========================================
  // 11. 班级作品展示墙
  // ==========================================
  renderGallery(main) {
    // 先用本地数据渲染
    this._renderGalleryWithData(main, GALLERY_WORKS);
    // 异步从 Vika 更新
    VikaAPI.fetchTable('gallery').then(items => {
      if (!items || items.length === 0) return;
      const vikaData = items.map(item => ({
        id: item.id,
        studentName: item['学生姓名'] || item.studentName || '同学',
        poem: item['诗题'] || item.poem || '',
        author: item['作者'] || item.author || '',
        imageContent: item['原文'] || '',
        imagePrompt: item['AI提示词'] || item.imagePrompt || '',
        imageUrl: item['图片URL'] || item.imageUrl || '',
        appreciation: item['赏析文字'] || item.appreciation || '',
        likes: parseInt(item['点赞数'] || item.likes || 0),
      }));
      if (vikaData.length >= GALLERY_WORKS.length) {
        this._renderGalleryWithData(main, vikaData);
      }
    });
  },

  _renderGalleryWithData(main, works) {
    main.innerHTML = `
      <div class="page-header">
        <h2>🖼️ 班级作品展示墙</h2>
        <p>同学们创作的AI诗词海报 | 共 ${works.length} 件作品</p>
      </div>

      <div class="gallery-grid">
        ${works.map(w => `
          <div class="poster-card">
            <div class="poster-image">
              ${w.imageUrl ? `<img src="${w.imageUrl}" alt="AI海报" style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><div style="display:none;font-size:48px;line-height:1">${(() => { const parent = IMAGERIES.find(i => i.poems.some(p => p.title === w.poem)); return parent ? parent.emoji : '📜'; })()}</div>` : (() => { const parent = IMAGERIES.find(i => i.poems.some(p => p.title === w.poem)); return parent ? parent.emoji : (w.poem === '静夜思' ? '🌙' : w.poem === '江雪' ? '⛵' : w.poem === '望岳' ? '⛰️' : w.poem === '春望' ? '🏚️' : w.poem === '山行' ? '🍁' : w.poem === '枫桥夜泊' ? '🌉' : w.poem === '饮酒·其五' ? '🏵️' : w.poem === '登高' ? '🍂' : '📜'); })()}
            </div>
            <div class="poster-body">
              <div class="poster-poem">《${w.poem}》</div>
              <div class="poster-author">${w.author} | 创作者：${w.studentName}</div>
              <div class="poster-content">
                ${(IMAGERIES.flatMap(i => i.poems).find(p => p.title === w.poem)?.verse || '') ||
                  (PRACTICE_POEMS.find(p => p.title === w.poem)?.content?.substring(0, 50) || '') ||
                  (HOMEWORK_POEMS.find(p => p.title === w.poem)?.content?.substring(0, 50) || '') ||
                  (w.imageContent?.substring(0, 50) || '')}...
              </div>
              <div class="poster-appreciation">
                <strong>🔍 赏析：</strong>${w.appreciation}
              </div>
              <div style="margin-top:8px">
                <span class="tag tag-info" style="font-size:11px">${w.imagePrompt ? '🖼️ ' + w.imagePrompt.substring(0, 30) + '...' : 'AI生成'}</span>
              </div>
            </div>
            <div class="poster-footer">
              <span onclick="App.likeGalleryWork('${w.id}', this)" style="cursor:pointer">👍 ${w.likes} 赞</span>
              <span>💬 评论</span>
              <span>🔗 分享</span>
            </div>
          </div>
        `).join('')}
      </div>

      ${works.length === 0 ? `
        <div class="empty-state">
          <div class="icon">🖼️</div>
          <h3>还没有作品</h3>
          <p>去"AI诗词海报"页创作第一幅作品吧！</p>
        </div>
      ` : ''}

      <div class="card" style="margin-top:24px;text-align:center;background:linear-gradient(135deg, rgba(45,90,39,0.05), rgba(212,168,83,0.08))">
        <h3 style="margin-bottom:8px">🏆 优秀作品标准</h3>
        <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;color:var(--text-secondary)">
          <span>🎯 意象准确</span>
          <span>🎨 意境契合</span>
          <span>📝 赏析深刻</span>
          <span>🖼️ 视觉和谐</span>
          <span>✨ 创意独特</span>
        </div>
      </div>
    `;
  },

  likeGalleryWork(id, el) {
    const work = GALLERY_WORKS.find(w => w.id === id);
    if (work) {
      work.likes++;
      el.textContent = `👍 ${work.likes} 赞`;
    }
  }

};

// ========== 启动应用 ==========
document.addEventListener('DOMContentLoaded', () => App.init());