# ========================================
# 诗中画·画中情 — 后端代理服务器
# 代理: 豆包 AI 文生图 + Vika 云数据库
# ========================================
import os
import json
import requests as req
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from openai import OpenAI

app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# ========== 配置 ==========
DOUBAO_API_KEY = "ark-059379cf-2a44-434e-871e-dcc100cbfc8c-a591b"
DOUBAO_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3"
DOUBAO_MODEL = "doubao-seedream-5-0-260128"

DEEPSEEK_API_KEY = "sk-b3e8f92777fa4399ba9984dd71b71d22"
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_MODEL = "deepseek-chat"

VIKA_TOKEN = "uskYItdvRwLeQPZ4Zy5tKGs"
VIKA_BASE = "https://api.vika.cn/fusion/v1"
VIKA_SPACE_ID = "spcYZbTj1Lxpc"
VIKA_FOLDER_ID = "fodC4TejWjQcc"

# Vika 表ID映射
VIKA_TABLES = {
    "users":      "dst0JTX5YuFajaVHmy",
    "imageries":  "dstmk2vxUdNh0V1Tcc",
    "moments":    "dstjTAQamUDqHw4R0y",
    "challenges": "dstQaKugSMVoeNZrsF",
    "practices":  "dst7T4fNvu8Dbnalad",
    "homeworks":  "dstbyiqGj5PRLjMBDE",
    "gallery":    "dstgMhD3txlqSFFHlR",
    "records":    "dstB5zQbsh1nYalFuo",
}

# 初始化豆包客户端
doubao_client = OpenAI(
    base_url=DOUBAO_BASE_URL,
    api_key=DOUBAO_API_KEY,
)

# 初始化 DeepSeek 客户端
deepseek_client = OpenAI(
    base_url=DEEPSEEK_BASE_URL,
    api_key=DEEPSEEK_API_KEY,
)

# ========== Vika 代理辅助函数 ==========
def vika_headers():
    return {
        "Authorization": f"Bearer {VIKA_TOKEN}",
        "Content-Type": "application/json"
    }

def vika_get(table_key):
    """获取表的所有记录"""
    dst_id = VIKA_TABLES.get(table_key)
    if not dst_id:
        return {"success": False, "error": f"未知表: {table_key}"}
    try:
        r = req.get(f"{VIKA_BASE}/datasheets/{dst_id}/records",
                    headers=vika_headers(), params={"pageSize": 1000}, timeout=15)
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e)}

def vika_create(table_key, fields):
    """创建一条记录"""
    dst_id = VIKA_TABLES.get(table_key)
    if not dst_id:
        return {"success": False, "error": f"未知表: {table_key}"}
    try:
        r = req.post(f"{VIKA_BASE}/datasheets/{dst_id}/records",
                     headers=vika_headers(),
                     json={"records": [{"fields": fields}], "fieldKey": "name"},
                     timeout=15)
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e)}

def vika_delete(table_key, record_id):
    """删除一条记录"""
    dst_id = VIKA_TABLES.get(table_key)
    if not dst_id:
        return {"success": False, "error": f"未知表: {table_key}"}
    try:
        r = req.delete(f"{VIKA_BASE}/datasheets/{dst_id}/records",
                       headers=vika_headers(),
                       params={"recordIds": record_id},
                       timeout=15)
        return r.json()
    except Exception as e:
        return {"success": False, "error": str(e)}

# ========== 主页 ==========
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# ========== AI 文生图接口 ==========
@app.route('/api/generate-image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        size = data.get('size', '2K')
        if not prompt:
            return jsonify({'success': False, 'error': '请提供图像描述提示词'}), 400
        print(f"[Doubao] 生成图像: {prompt[:80]}...")
        response = doubao_client.images.generate(
            model=DOUBAO_MODEL, prompt=prompt, size=size,
            response_format="url", extra_body={"watermark": True},
        )
        image_url = response.data[0].url
        print(f"[Doubao] 成功: {image_url[:80]}...")
        return jsonify({'success': True, 'url': image_url, 'prompt': prompt})
    except Exception as e:
        print(f"[Doubao] 失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ========== Vika 通用查询接口 ==========
@app.route('/api/vika/<table_key>', methods=['GET'])
def api_vika_list(table_key):
    """查询表数据"""
    result = vika_get(table_key)
    if result.get("success"):
        records = result.get("data", {}).get("records", [])
        # 简化返回格式
        items = [{"id": r.get("recordId"), **r.get("fields", {})} for r in records]
        return jsonify({"success": True, "data": items, "total": len(items)})
    return jsonify(result), 500

# ========== Vika 通用创建接口 ==========
@app.route('/api/vika/<table_key>', methods=['POST'])
def api_vika_create(table_key):
    """创建一条记录"""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "请提供数据"}), 400
    result = vika_create(table_key, data)
    if result.get("success"):
        rec = result.get("data", {}).get("records", [{}])[0]
        return jsonify({"success": True, "id": rec.get("recordId"), "fields": rec.get("fields", {})})
    return jsonify(result), 500

# ========== Vika 通用删除接口 ==========
@app.route('/api/vika/<table_key>/<record_id>', methods=['DELETE'])
def api_vika_delete(table_key, record_id):
    """删除一条记录"""
    result = vika_delete(table_key, record_id)
    if result.get("success"):
        return jsonify({"success": True})
    return jsonify(result), 500

# ========== 业务接口: 提交学习记录 ==========
@app.route('/api/submit-record', methods=['POST'])
def submit_record():
    """记录学生学习成绩
    请求: { student: '姓名', module: '课前学习', type: '挑战赛', score: 85, detail: '...' }
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "请提供数据"}), 400
    
    fields = {
        "学生姓名": data.get("student", ""),
        "模块": data.get("module", ""),
        "类型": data.get("type", ""),
        "得分": str(data.get("score", 0)),
        "详情": data.get("detail", ""),
    }
    result = vika_create("records", fields)
    if result.get("success"):
        print(f"[Vika] 学习记录已保存: {fields['学生姓名']} - {fields['类型']} - {fields['得分']}分")
        return jsonify({"success": True, "message": "记录已保存"})
    print(f"[Vika] 保存失败: {result.get('message')}")
    return jsonify(result), 500

# ========== 业务接口: 提交朋友圈 ==========
@app.route('/api/submit-moment', methods=['POST'])
def submit_moment():
    """提交一条朋友圈
    请求: { student: '姓名', imagery: '月', content: '...', verses: '...', symbolism: '...', question: '...' }
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "请提供数据"}), 400
    
    fields = {
        "学生姓名": data.get("student", ""),
        "意象": data.get("imagery", ""),
        "内容": data.get("content", ""),
        "相关诗句": data.get("verses", ""),
        "象征意义": data.get("symbolism", ""),
        "提问": data.get("question", ""),
        "点赞数": "0",
    }
    result = vika_create("moments", fields)
    if result.get("success"):
        print(f"[Vika] 朋友圈已保存: {fields['学生姓名']} - {fields['意象']}")
        return jsonify({"success": True, "message": "朋友圈发布成功"})
    return jsonify(result), 500

# ========== 业务接口: 提交作品 ==========
@app.route('/api/submit-gallery', methods=['POST'])
def submit_gallery():
    """提交作品到作品墙
    请求: { student: '姓名', poem: '诗题', author: '作者', content: '原文', prompt: '提示词', appreciation: '赏析' }
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "请提供数据"}), 400
    
    fields = {
        "学生姓名": data.get("student", ""),
        "诗题": data.get("poem", ""),
        "作者": data.get("author", ""),
        "原文": data.get("content", ""),
        "AI提示词": data.get("prompt", ""),
        "赏析文字": data.get("appreciation", ""),
        "点赞数": "0",
    }
    result = vika_create("gallery", fields)
    if result.get("success"):
        print(f"[Vika] 作品已保存: {fields['学生姓名']} - {fields['诗题']}")
        return jsonify({"success": True, "message": "作品已发布"})
    return jsonify(result), 500

# ========== DeepSeek 诗歌分析接口 ==========
@app.route('/api/analyze-poem', methods=['POST'])
def analyze_poem():
    """AI诗歌分析：提取意象、分析意境、判断情感
    请求: { poem: '诗句', author: '作者', task: 'analyze_imagery|analyze_emotion|analyze_mood|full' }
    """
    try:
        data = request.get_json()
        poem = data.get('poem', '').strip()
        author = data.get('author', '')
        task = data.get('task', 'full')
        if not poem:
            return jsonify({'success': False, 'error': '请提供诗句'}), 400

        task_prompts = {
            'analyze_imagery': f'请分析以下诗句中的意象（物象），以JSON数组格式返回，每个意象包含name和说明：{poem}。格式：{{"imageries": [{{"name": "月", "description": "..."}}]}}',
            'analyze_emotion': f'请分析以下诗句表达的情感，以JSON格式返回：{poem}。格式：{{"emotion": "思乡", "explanation": "..."}}',
            'analyze_mood': f'请分析以下诗句营造的意境，以JSON格式返回：{poem}。格式：{{"mood": "清冷孤寂", "explanation": "..."}}',
            'full': f'请全面分析以下诗词的意象、意境和情感，以JSON格式返回。诗题：{author}，诗句：{poem}。格式：{{"imageries": [{{"name": "意象名", "description": "说明"}}], "mood": "意境概括", "emotion": "情感概括", "analysis": "200字以内的赏析文字"}}'
        }

        prompt = task_prompts.get(task, task_prompts['full'])
        print(f"[DeepSeek] 分析诗词: {poem[:30]}... (task={task})")

        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一位中国古典诗词鉴赏专家，擅长分析诗歌的意象、意境和情感。请严格以JSON格式回复，不要使用markdown代码块。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        result_text = response.choices[0].message.content.strip()
        # 尝试移除可能的 markdown 代码块标记
        if result_text.startswith('```'):
            result_text = result_text.split('\n', 1)[1]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
        result = json.loads(result_text)

        print(f"[DeepSeek] 分析完成: {json.dumps(result, ensure_ascii=False)[:100]}...")
        return jsonify({'success': True, **result})

    except json.JSONDecodeError as e:
        print(f"[DeepSeek] JSON解析失败: {e}")
        return jsonify({'success': False, 'error': f'AI返回格式异常: {str(e)}'}), 500
    except Exception as e:
        print(f"[DeepSeek] 失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/score-answer', methods=['POST'])
def score_answer():
    """AI智能评分：对比学生答案与参考答案
    请求: { student_answer: '...', reference: { imageries: [], mood: '', emotion: '' }, question: '...' }
    """
    try:
        data = request.get_json()
        student_answer = data.get('student_answer', '').strip()
        reference = data.get('reference', {})
        question = data.get('question', '')

        if not student_answer:
            return jsonify({'success': False, 'error': '请提供学生答案'}), 400

        ref_imageries = reference.get('imageries', [])
        ref_mood = reference.get('mood', '')
        ref_emotion = reference.get('emotion', '')

        prompt = f"""请对以下学生的诗歌鉴赏答案进行评分。评分标准：意象识别（40分）、意境分析（30分）、情感把握（30分），总分100分。
参考答案：意象={ref_imageries}、意境={ref_mood}、情感={ref_emotion}
题目：{question}
学生答案：{student_answer}
请以JSON格式回复：{{"score": 85, "feedback": "评语", "highlights": ["亮点1"], "suggestions": ["建议1"], "correct_imageries": ["命中的意象"], "missing": ["遗漏的意象"]}}"""

        print(f"[DeepSeek] 评分中: {student_answer[:30]}...")

        response = deepseek_client.chat.completions.create(
            model=DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": "你是一位语文教师，负责批改初三学生的诗歌鉴赏作业。请严格以JSON格式回复，评语要鼓励为主、指正为辅。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800,
        )

        result_text = response.choices[0].message.content.strip()
        if result_text.startswith('```'):
            result_text = result_text.split('\n', 1)[1]
            if result_text.endswith('```'):
                result_text = result_text[:-3]
        result = json.loads(result_text)

        print(f"[DeepSeek] 评分完成: score={result.get('score')}")
        return jsonify({'success': True, **result})

    except json.JSONDecodeError as e:
        print(f"[DeepSeek] JSON解析失败: {e}")
        return jsonify({'success': False, 'score': 8, 'feedback': f'AI评分异常，暂给参与分8分。({str(e)})'}), 200
    except Exception as e:
        print(f"[DeepSeek] 评分失败: {str(e)}")
        return jsonify({'success': False, 'score': 8, 'feedback': f'AI评分服务暂不可用，已给参与分8分。', 'error': str(e)}), 200

# ========== Socket.IO 协作白板事件 ==========
# 存储每个房间的画布状态
canvas_states = {}  # { room_id: { objects: [], locked: False, users: [] } }

@socketio.on('join_room')
def handle_join(data):
    """学生加入协作房间（按小组：group_1/2/3 或教师白板）"""
    room = data.get('room', 'group_1')
    username = data.get('username', '匿名用户')
    role = data.get('role', 'student')

    join_room(room)

    # 初始化房间状态
    if room not in canvas_states:
        canvas_states[room] = {'objects': [], 'locked': False, 'users': []}

    state = canvas_states[room]
    if username not in state['users']:
        state['users'].append(username)

    print(f"[Socket.IO] {username}({role}) 加入房间 {room}")

    # 发送当前画布状态给新加入者
    emit('canvas_init', {
        'objects': state['objects'],
        'locked': state['locked'],
        'users': state['users']
    })

    # 广播给房间其他人
    emit('user_joined', {
        'username': username,
        'users': state['users']
    }, to=room, include_self=False)


@socketio.on('canvas_sync')
def handle_canvas_sync(data):
    """同步画布操作：新增/移动/修改对象"""
    room = data.get('room', 'group_1')
    action = data.get('action', 'add')  # add | move | modify | delete
    obj_data = data.get('object', {})
    username = data.get('username', '匿名用户')

    if room not in canvas_states:
        canvas_states[room] = {'objects': [], 'locked': False, 'users': []}

    state = canvas_states[room]

    if state['locked'] and username != 'teacher':
        emit('error_msg', {'message': '画布已被教师锁定，无法编辑'})
        return

    if action == 'add':
        state['objects'].append(obj_data)
    elif action == 'modify':
        for i, o in enumerate(state['objects']):
            if o.get('id') == obj_data.get('id'):
                state['objects'][i].update(obj_data)
                break
    elif action == 'delete':
        state['objects'] = [o for o in state['objects'] if o.get('id') != obj_data.get('id')]
    elif action == 'move':
        for i, o in enumerate(state['objects']):
            if o.get('id') == obj_data.get('id'):
                state['objects'][i]['left'] = obj_data.get('left')
                state['objects'][i]['top'] = obj_data.get('top')
                break
    elif action == 'clear':
        state['objects'] = []

    # 广播给房间其他人
    emit('canvas_update', {
        'action': action,
        'object': obj_data,
        'username': username
    }, to=room, include_self=False)


@socketio.on('clear_canvas')
def handle_clear_canvas(data):
    """教师清空画布"""
    room = data.get('room', 'group_1')
    username = data.get('username', 'teacher')

    if room in canvas_states:
        canvas_states[room]['objects'] = []

    emit('canvas_cleared', {'username': username}, to=room)
    print(f"[Socket.IO] {username} 清空了房间 {room} 的画布")


@socketio.on('lock_canvas')
def handle_lock(data):
    """教师锁定/解锁画布编辑"""
    room = data.get('room', 'group_1')
    locked = data.get('locked', True)

    if room in canvas_states:
        canvas_states[room]['locked'] = locked

    emit('canvas_lock_changed', {'locked': locked}, to=room)
    status = '锁定' if locked else '解锁'
    print(f"[Socket.IO] 房间 {room} 画布已{status}")


@socketio.on('leave_room')
def handle_leave(data):
    """学生离开协作房间"""
    room = data.get('room', 'group_1')
    username = data.get('username', '匿名用户')

    leave_room(room)

    if room in canvas_states and username in canvas_states[room]['users']:
        canvas_states[room]['users'].remove(username)

    users = canvas_states.get(room, {}).get('users', [])
    emit('user_left', {'username': username, 'users': users}, to=room)


# ========== AI 意境短片接口 ==========
@app.route('/api/generate-video', methods=['POST'])
def generate_video():
    """AI意境短片：先尝试豆包视频生成，失败回退AI图片+CSS动画方案
    请求: { prompt: '诗意画面描述', poem: '诗题', author: '作者', style: 'chinese_ink' }
    """
    try:
        data = request.get_json()
        prompt = data.get('prompt', '').strip()
        poem = data.get('poem', '')
        author = data.get('author', '')
        style = data.get('style', 'chinese_ink')

        if not prompt:
            return jsonify({'success': False, 'error': '请提供画面描述'}), 400

        print(f"[AI短片] 尝试生成意境图: {prompt[:60]}...")

        # 方案B：AI文生图 + CSS动画（稳定方案）
        # 增强提示词以生成适合动画的意境图
        enhanced_prompt = f"{prompt}，中国风水墨画风格，留白构图，意境深远，高清，16:9画幅"
        response = doubao_client.images.generate(
            model=DOUBAO_MODEL,
            prompt=enhanced_prompt,
            size="2K",
            response_format="url",
            extra_body={"watermark": True},
        )
        image_url = response.data[0].url

        print(f"[AI短片] 意境图生成成功: {image_url[:80]}...")

        return jsonify({
            'success': True,
            'mode': 'image_animation',  # 当前使用B方案
            'image_url': image_url,
            'poem': poem,
            'author': author,
            'animation_type': 'ken_burns',  # Ken Burns效果
            'prompt': enhanced_prompt,
        })

    except Exception as e:
        print(f"[AI短片] 失败: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ========== 健康检查 ==========
@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'doubao_model': DOUBAO_MODEL,
        'deepseek_model': DEEPSEEK_MODEL,
        'vika_tables': list(VIKA_TABLES.keys()),
        'apis': ['image_gen', 'deepseek_analyze', 'deepseek_score', 'vika', 'whiteboard', 'ai_video'],
    })

# ========== 启动 ==========
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    print("=" * 50)
    print("  诗中画·画中情 后端服务器")
    print(f"  豆包文生图: {DOUBAO_MODEL}")
    print(f"  DeepSeek分析: {DEEPSEEK_MODEL}")
    print(f"  Vika表: {len(VIKA_TABLES)}张")
    print(f"  Socket.IO协作白板: 已启用")
    print(f"  地址: http://0.0.0.0:{port}")
    print("=" * 50)
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)
