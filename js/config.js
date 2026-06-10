// ========================================
// 诗中画·画中情 — 后端配置
// 自动检测：本地开发用相对路径，生产环境用 Render 服务地址
// ========================================
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? ''  // 本地开发：Flask 同源，使用相对路径
  : 'https://poetry-painting-api.onrender.com';  // 生产环境：Render 后端
