// ========================================
// 诗中画·画中情 — 混合式教学平台数据
// ========================================

// ========== 用户数据 ==========
const USERS = {
  teacher: {
    id: 't001',
    name: '张老师',
    role: 'teacher',
    avatar: '👩‍🏫'
  },
  students: [
    { id: 's001', name: '李明', group: '第1组', avatar: '🧑‍🎓' },
    { id: 's002', name: '王芳', group: '第1组', avatar: '👩‍🎓' },
    { id: 's003', name: '陈强', group: '第2组', avatar: '🧑‍🎓' },
    { id: 's004', name: '刘洋', group: '第2组', avatar: '👩‍🎓' },
    { id: 's005', name: '赵敏', group: '第3组', avatar: '👩‍🎓' },
    { id: 's006', name: '周杰', group: '第3组', avatar: '🧑‍🎓' },
  ]
};

// ========== 意象数据 ==========
const IMAGERIES = [
  {
    id: 'img001', name: '月', emoji: '🌙',
    poems: [
      { title: '静夜思', author: '李白', verse: '举头望明月，低头思故乡。', emotion: '思乡' },
      { title: '水调歌头', author: '苏轼', verse: '但愿人长久，千里共婵娟。', emotion: '思亲与旷达' },
      { title: '闻王昌龄左迁龙标遥有此寄', author: '李白', verse: '我寄愁心与明月，随君直到夜郎西。', emotion: '牵挂友人' },
      { title: '春江花月夜', author: '张若虚', verse: '江畔何人初见月？江月何年初照人？', emotion: '人生哲思' },
    ]
  },
  {
    id: 'img002', name: '柳', emoji: '🌿',
    poems: [
      { title: '送元二使安西', author: '王维', verse: '渭城朝雨浥轻尘，客舍青青柳色新。', emotion: '送别' },
      { title: '雨霖铃', author: '柳永', verse: '今宵酒醒何处？杨柳岸，晓风残月。', emotion: '离别之愁' },
    ]
  },
  {
    id: 'img003', name: '雁', emoji: '🕊️',
    poems: [
      { title: '次北固山下', author: '王湾', verse: '乡书何处达？归雁洛阳边。', emotion: '思乡' },
      { title: '使至塞上', author: '王维', verse: '征蓬出汉塞，归雁入胡天。', emotion: '漂泊' },
    ]
  },
  {
    id: 'img004', name: '酒', emoji: '🍶',
    poems: [
      { title: '水调歌头', author: '苏轼', verse: '明月几时有？把酒问青天。', emotion: '旷达' },
      { title: '将进酒', author: '李白', verse: '人生得意须尽欢，莫使金樽空对月。', emotion: '豪迈' },
      { title: '渔家傲', author: '范仲淹', verse: '浊酒一杯家万里，燕然未勒归无计。', emotion: '思乡与忧国' },
    ]
  },
  {
    id: 'img005', name: '梅', emoji: '🌸',
    poems: [
      { title: '咏梅', author: '陆游', verse: '零落成泥碾作尘，只有香如故。', emotion: '坚贞' },
      { title: '梅花', author: '王安石', verse: '遥知不是雪，为有暗香来。', emotion: '高洁' },
    ]
  },
  {
    id: 'img006', name: '落花', emoji: '🥀',
    poems: [
      { title: '春晓', author: '孟浩然', verse: '夜来风雨声，花落知多少。', emotion: '惜春' },
      { title: '己亥杂诗', author: '龚自珍', verse: '落红不是无情物，化作春泥更护花。', emotion: '奉献' },
    ]
  },
  {
    id: 'img007', name: '长亭', emoji: '🏛️',
    poems: [
      { title: '送别', author: '李叔同', verse: '长亭外，古道边，芳草碧连天。', emotion: '送别' },
    ]
  },
  {
    id: 'img008', name: '孤舟', emoji: '⛵',
    poems: [
      { title: '江雪', author: '柳宗元', verse: '孤舟蓑笠翁，独钓寒江雪。', emotion: '孤独与高洁' },
      { title: '天净沙·秋思', author: '马致远', verse: '枯藤老树昏鸦，小桥流水人家，古道西风瘦马。', emotion: '漂泊思乡' },
    ]
  },
  {
    id: 'img009', name: '竹', emoji: '🎋',
    poems: [
      { title: '竹石', author: '郑燮', verse: '咬定青山不放松，立根原在破岩中。千磨万击还坚劲，任尔东西南北风。', emotion: '坚贞不屈' },
      { title: '竹里馆', author: '王维', verse: '独坐幽篁里，弹琴复长啸。深林人不知，明月来相照。', emotion: '隐逸闲适' },
      { title: '题李次云窗竹', author: '白居易', verse: '千花百草凋零后，留向纷纷雪里看。', emotion: '高洁品格' },
    ]
  },
  {
    id: 'img010', name: '菊', emoji: '🏵️',
    poems: [
      { title: '饮酒·其五', author: '陶渊明', verse: '采菊东篱下，悠然见南山。', emotion: '隐逸闲适' },
      { title: '醉花阴', author: '李清照', verse: '莫道不消魂，帘卷西风，人比黄花瘦。', emotion: '相思愁苦' },
      { title: '不第后赋菊', author: '黄巢', verse: '待到秋来九月八，我花开后百花杀。', emotion: '豪迈不屈' },
    ]
  },
  {
    id: 'img011', name: '夕阳', emoji: '🌅',
    poems: [
      { title: '登乐游原', author: '李商隐', verse: '夕阳无限好，只是近黄昏。', emotion: '时光易逝' },
      { title: '使至塞上', author: '王维', verse: '大漠孤烟直，长河落日圆。', emotion: '壮阔雄浑' },
      { title: '乌衣巷', author: '刘禹锡', verse: '朱雀桥边野草花，乌衣巷口夕阳斜。', emotion: '沧桑变迁' },
      { title: '天净沙·秋思', author: '马致远', verse: '夕阳西下，断肠人在天涯。', emotion: '漂泊思乡' },
    ]
  },
  {
    id: 'img012', name: '雨', emoji: '🌧️',
    poems: [
      { title: '春夜喜雨', author: '杜甫', verse: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。', emotion: '喜悦赞美' },
      { title: '夜雨寄北', author: '李商隐', verse: '君问归期未有期，巴山夜雨涨秋池。', emotion: '思念期盼' },
      { title: '清明', author: '杜牧', verse: '清明时节雨纷纷，路上行人欲断魂。', emotion: '哀愁凄凉' },
      { title: '芙蓉楼送辛渐', author: '王昌龄', verse: '寒雨连江夜入吴，平明送客楚山孤。', emotion: '送别孤寂' },
    ]
  },
];

// ========== 微视频 ==========
const MICRO_VIDEO = {
  title: '诗歌中的意象密码',
  duration: '5分钟',
  description: '什么是意象？常见诗歌意象有哪些？为什么古人喜欢借景抒情？',
  question: '为什么同一个意象会在不同诗歌中传递不同的情感？',
  thumbnail: '🎬'
};

// ========== 朋友圈示例数据 ==========
const MOMENTS_DATA = [
  {
    id: 'm001',
    studentId: 's001',
    studentName: '李明',
    imagery: '月',
    content: '今天又被诗人写进诗里了。',
    verses: ['举头望明月，低头思故乡。', '但愿人长久，千里共婵娟。'],
    symbolism: '思乡、团圆、思念',
    question: '大家觉得我究竟代表思乡还是团圆？',
    likes: 12,
    comments: [
      { studentName: '王芳', text: '我觉得两者都有！月有阴晴圆缺，人有悲欢离合。' },
      { studentName: '陈强', text: '关键看诗人当时的心情和处境。' }
    ]
  },
  {
    id: 'm002',
    studentId: 's002',
    studentName: '王芳',
    imagery: '柳',
    content: '古人在送别时总爱折我，好不舍。',
    verses: ['渭城朝雨浥轻尘，客舍青青柳色新。'],
    symbolism: '送别、挽留、惜别',
    question: '"柳"和"留"谐音，那折柳送别是不是一种含蓄的挽留？',
    likes: 8,
    comments: []
  },
  {
    id: 'm003',
    studentId: 's003',
    studentName: '陈强',
    imagery: '酒',
    content: '诗人们开心时喝我，忧愁时也喝我……',
    verses: ['人生得意须尽欢，莫使金樽空对月。', '浊酒一杯家万里。'],
    symbolism: '豪迈、忧愁、思念',
    question: '同样是喝酒，为什么李白喝出了豪迈，范仲淹喝出了哀愁？',
    likes: 15,
    comments: [
      { studentName: '李明', text: '心境不同，酒的味道就不同。李白"得意"时喝酒是狂欢，范仲淹"家万里"时喝酒是解愁。' }
    ]
  },
  {
    id: 'm004',
    studentId: 's004',
    studentName: '刘洋',
    imagery: '雁',
    content: '我是天空的信使，每年准时飞过诗人的窗前——有人盼我带来家书，有人说我是漂泊的象征。',
    verses: ['乡书何处达？归雁洛阳边。', '征蓬出汉塞，归雁入胡天。'],
    symbolism: '思乡、漂泊、音信',
    question: '同样是我这只雁，为什么在江南是"归雁"，带着家的温暖；在塞北就成了"征蓬"的同伴，透着漂泊的苍凉？',
    likes: 10,
    comments: [
      { studentName: '王芳', text: '意象的情感取决于诗人的处境！王湾在北固山下想家，雁是希望；王维在塞外漂泊，雁是漂泊的镜像。' }
    ]
  },
  {
    id: 'm005',
    studentId: 's005',
    studentName: '赵敏',
    imagery: '梅',
    content: '我在寒冬绽放，傲雪凌霜。陆游说我"只有香如故"，王安石说我"为有暗香来"。',
    verses: ['零落成泥碾作尘，只有香如故。', '遥知不是雪，为有暗香来。'],
    symbolism: '坚贞、高洁、傲骨',
    question: '陆游的梅是"碾作尘"的悲壮，王安石的梅是"暗香来"的清雅——是梅花不同，还是诗人心境不同？',
    likes: 18,
    comments: [
      { studentName: '周杰', text: '我觉得是诗人的处境不同！陆游一生报国无门，写梅是在写自己；王安石变法失败后退居金陵，写梅更平和。' }
    ]
  },
  {
    id: 'm006',
    studentId: 's004',
    studentName: '刘洋',
    imagery: '落花',
    content: '我落下时，有人惋惜春光不再，有人却说我化作春泥更护花——同样是我，在不同诗人眼里完全不同。',
    verses: ['夜来风雨声，花落知多少。', '落红不是无情物，化作春泥更护花。'],
    symbolism: '惜春、奉献、生命无常',
    question: '孟浩然看到我伤感（惜春），龚自珍看到我欣慰（奉献）——同样是我落花，为什么感受如此天差地别？',
    likes: 12,
    comments: []
  },
  {
    id: 'm007',
    studentId: 's006',
    studentName: '周杰',
    imagery: '长亭',
    content: '我是送别的坐标，多少诗人站在我身边，望着远去的背影不忍离去。',
    verses: ['长亭外，古道边，芳草碧连天。'],
    symbolism: '送别、离愁、惜别',
    question: '古人为什么总在亭子告别？"长亭"和"杨柳"在送别诗中是什么样的搭配关系？',
    likes: 7,
    comments: [
      { studentName: '陈强', text: '古代十里一长亭，五里一短亭，亭子是送别的固定地点。"柳"谐音"留"，折柳送别是含蓄的挽留。' }
    ]
  },
  {
    id: 'm008',
    studentId: 's001',
    studentName: '李明',
    imagery: '孤舟',
    content: '我漂在寒江上，天地一片白茫茫。诗人说我是"独钓"的陪伴——可这究竟是孤独，还是一种选择？',
    verses: ['孤舟蓑笠翁，独钓寒江雪。'],
    symbolism: '孤独、高洁、坚守',
    question: '"孤舟"配"独钓"——柳宗元笔下的孤独，是一种被动的处境，还是一种主动的选择？',
    likes: 14,
    comments: [
      { studentName: '赵敏', text: '这是一道哲学题啊！柳宗元被贬永州，表面写孤独，其实在表达"我宁愿孤独也不随波逐流"的态度。' }
    ]
  },
  {
    id: 'm009',
    studentId: 's002',
    studentName: '王芳',
    imagery: '竹',
    content: '我咬定青山，千磨万击还坚劲！郑板桥说我"任尔东西南北风"，王维却在我的林子里弹琴长啸——我是刚还是柔？',
    verses: ['咬定青山不放松，立根原在破岩中。', '独坐幽篁里，弹琴复长啸。'],
    symbolism: '坚贞、高洁、隐逸',
    question: '郑板桥笔下"咬定青山"的竹，和王维笔下"独坐幽篁"的竹——同一种植物，为什么一个刚硬一个清幽？',
    likes: 11,
    comments: []
  },
  {
    id: 'm010',
    studentId: 's003',
    studentName: '陈强',
    imagery: '菊',
    content: '陶渊明在东篱下采我，悠然自得；李清照却说帘卷西风，我比人还瘦——同一朵菊，两种人生。',
    verses: ['采菊东篱下，悠然见南山。', '莫道不消魂，帘卷西风，人比黄花瘦。'],
    symbolism: '隐逸、高洁、相思愁苦',
    question: '陶渊明的菊和李清照的菊有什么不同？同一个意象如何承载完全不同的人生况味？',
    likes: 16,
    comments: [
      { studentName: '刘洋', text: '核心是"以我观物"！陶渊明隐居田园悠然自得，菊就悠闲；李清照思念丈夫愁苦不堪，菊就消瘦。' }
    ]
  },
  {
    id: 'm011',
    studentId: 's005',
    studentName: '赵敏',
    imagery: '夕阳',
    content: '我无限美好，却只是近黄昏——李商隐对我惋惜，马致远对着我断肠，王维却看到壮阔。',
    verses: ['夕阳无限好，只是近黄昏。', '大漠孤烟直，长河落日圆。'],
    symbolism: '时光流逝、壮阔、思乡',
    question: '李商隐说"只是近黄昏"是惋惜，王维说"长河落日圆"是壮阔——同一个夕阳，为何承载截然不同的情绪？',
    likes: 13,
    comments: []
  },
  {
    id: 'm012',
    studentId: 's004',
    studentName: '刘洋',
    imagery: '雨',
    content: '杜甫赞我"知时节"，杜牧怨我"欲断魂"——同样是我这场雨，是好还是坏？好像取决于诗人当时在做什么。',
    verses: ['好雨知时节，当春乃发生。', '清明时节雨纷纷，路上行人欲断魂。'],
    symbolism: '喜悦、哀愁、思念',
    question: '杜甫感受到的是"润物细无声"的喜悦，杜牧感受到的是"欲断魂"的哀愁——同样是我这场雨，为什么？',
    likes: 9,
    comments: [
      { studentName: '周杰', text: '情境决定情感！杜甫在春夜盼雨，喜雨是及时雨；杜牧在清明赶路，雨就成了添堵的愁绪。' }
    ]
  }
];

// ========== 意象组合挑战赛 ==========
const CHALLENGE_LEVELS = [
  {
    level: 1,
    title: '第一关：寻找原诗',
    type: 'guess_poem',
    items: [
      { imageries: ['枯藤', '老树', '昏鸦'], answer: '天净沙·秋思', author: '马致远', hints: ['元曲', '秋日旅途'] },
      { imageries: ['明月', '酒', '青天'], answer: '水调歌头', author: '苏轼', hints: ['中秋', '宋词'] },
      { imageries: ['大漠', '孤烟', '长河', '落日'], answer: '使至塞上', author: '王维', hints: ['边塞诗', '唐代'] },
      { imageries: ['孤舟', '寒江', '雪'], answer: '江雪', author: '柳宗元', hints: ['唐代', '孤独'] },
    ]
  },
  {
    level: 2,
    title: '第二关：组合意象析意境',
    type: 'analyze',
    items: [
      {
        imageries: ['枯藤', '老树', '昏鸦', '小桥', '流水', '人家', '古道', '西风', '瘦马', '夕阳'],
        questions: [
          '这些意象共同构成什么画面？',
          '营造了什么意境？',
          '表达了什么情感？'
        ],
        reference: {
          scene: '秋日黄昏，游子独行荒凉古道，途经萧瑟村落。',
          mood: '凄清、萧瑟、苍凉',
          emotion: '漂泊天涯的孤寂愁苦与思乡之情'
        }
      },
      {
        imageries: ['大漠', '孤烟', '长河', '落日'],
        questions: [
          '这四个意象组合在一起，构成怎样的画面？',
          '与天净沙·秋思的萧瑟相比，这里的意境有什么不同？',
          '这种意境表达了诗人怎样的情感？'
        ],
        reference: {
          scene: '辽阔沙漠，烽烟直上，黄河蜿蜒，落日浑圆。',
          mood: '雄浑壮阔、苍茫辽远',
          emotion: '对边塞壮丽风光的赞美与开阔胸襟'
        }
      },
      {
        imageries: ['明月', '酒', '青天'],
        questions: [
          '苏轼把这三个意象组合在一起，表达了什么？',
          '"把酒问青天"是一种什么姿态？',
          '这种意象组合体现了苏轼怎样的人生态度？'
        ],
        reference: {
          scene: '中秋月夜，诗人举杯仰望，与天对饮话人间。',
          mood: '清旷超逸、旷达洒脱',
          emotion: '对人生的通透感悟与超然旷达'
        }
      }
    ]
  },
  {
    level: 3,
    title: '第三关：意象情感连连看',
    type: 'matching',
    items: [
      {
        pairs: [
          { imagery: '柳', emotion: '送别' },
          { imagery: '月', emotion: '思乡' },
          { imagery: '酒', emotion: '豪迈' },
          { imagery: '梅', emotion: '坚贞' },
          { imagery: '雁', emotion: '漂泊' },
          { imagery: '竹', emotion: '不屈' },
        ],
        instruction: '将左侧意象与右侧最匹配的情感连线（拖动匹配）',
        story: '同一个意象可以在不同语境下表达不同情感，但每个意象都有最经典的情感对应。请为以下意象找到它的"代表作"情感。'
      },
      {
        pairs: [
          { imagery: '夕阳', emotion: '时光流逝' },
          { imagery: '雨', emotion: '愁绪' },
          { imagery: '菊', emotion: '隐逸' },
          { imagery: '落花', emotion: '惜春' },
          { imagery: '孤舟', emotion: '孤独' },
          { imagery: '长亭', emotion: '离别' },
        ],
        instruction: '匹配意象与其经典情感表达',
        story: '古典诗词中的意象经过千年沉淀，形成了相对稳定的情感指向。这是文化传承的密码。'
      }
    ]
  },
  {
    level: 4,
    title: '第四关：创意意象组合',
    type: 'creative',
    items: [
      {
        given: ['枯藤', '老树', '昏鸦', '小桥', '流水', '人家', '古道', '西风', '瘦马', '夕阳'],
        task: '从以上意象中任选3~5个，重新组合，写两句话描述你创造的画面和意境。',
        tips: [
          '选择能形成统一色调的意象（如：冷色调 vs 暖色调）',
          '注意意象之间的空间关系（远、近、高、低）',
          '思考你想表达什么样的情感基调'
        ],
        example: '我选"小桥+流水+人家"——三个意象组合出江南水乡的宁静画面，与枯藤老树的萧瑟形成鲜明对比。'
      },
      {
        given: ['明月', '酒', '青天', '江水', '孤舟', '柳', '长亭', '雁'],
        task: '请创作一组意象组合，表达"思念远方友人"的情感，并简要说明理由。',
        tips: [
          '先确定情感基调：思念',
          '选择合适的主意象和辅助意象',
          '安排意象的空间层次（天地、远近、动静）'
        ],
        example: '我选"明月+江水+孤舟"——明月照江水，孤舟远行，营造出"望月思人、江水悠悠"的思念意境。'
      }
    ]
  }
];

// ========== 意象情感地图数据 ==========
const EMOTION_MAP = {
  center: '月',
  branches: [
    { poem: '静夜思', author: '李白', emotion: '思乡', color: '#3B82F6' },
    { poem: '水调歌头', author: '苏轼', emotion: '思亲与旷达', color: '#10B981' },
    { poem: '闻王昌龄左迁龙标遥有此寄', author: '李白', emotion: '牵挂友人', color: '#F59E0B' },
    { poem: '春江花月夜', author: '张若虚', emotion: '人生哲思', color: '#8B5CF6' },
  ],
  analysis: {
    reasons: [
      '诗人身份不同（游子 vs 官员 vs 哲人）',
      '创作背景不同（流放 vs 中秋 vs 送别）',
      '搭配意象不同（霜 vs 酒 vs 愁心 vs 江水）',
      '表现主题不同（思乡 vs 思亲 vs 牵挂 vs 哲思）'
    ]
  }
};

// ========== 诗歌鉴赏实战数据 ==========
const PRACTICE_POEMS = [
  {
    id: 'p001',
    title: '天净沙·秋思',
    author: '马致远',
    content: '枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。',
    analysis: {
      imageries: ['枯藤', '老树', '昏鸦', '小桥', '流水', '人家', '古道', '西风', '瘦马', '夕阳'],
      mood: '凄清、萧瑟、苍凉',
      emotion: '漂泊天涯的孤寂愁苦与思乡之情'
    },
    template: '诗人通过"枯藤、老树、昏鸦、古道、西风、瘦马"等意象，营造出"萧瑟苍凉"的意境，表达了"漂泊天涯的孤寂愁苦与思乡之情"。'
  },
  {
    id: 'p002',
    title: '望岳',
    author: '杜甫',
    content: '岱宗夫如何？齐鲁青未了。造化钟神秀，阴阳割昏晓。荡胸生曾云，决眦入归鸟。会当凌绝顶，一览众山小。',
    analysis: {
      imageries: ['泰山', '曾云', '归鸟', '绝顶'],
      mood: '雄浑壮阔、生机勃勃',
      emotion: '不畏艰难、勇于攀登的豪情壮志'
    }
  },
  {
    id: 'p003',
    title: '春望',
    author: '杜甫',
    content: '国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。烽火连三月，家书抵万金。白头搔更短，浑欲不胜簪。',
    analysis: {
      imageries: ['山河', '草木', '花', '鸟', '烽火', '家书', '白头'],
      mood: '荒凉破败、忧国伤时',
      emotion: '国破家亡的沉痛悲伤与忧国忧民之情'
    }
  },
  {
    id: 'p004',
    title: '钱塘湖春行',
    author: '白居易',
    content: '孤山寺北贾亭西，水面初平云脚低。几处早莺争暖树，谁家新燕啄春泥。乱花渐欲迷人眼，浅草才能没马蹄。最爱湖东行不足，绿杨阴里白沙堤。',
    analysis: {
      imageries: ['早莺', '暖树', '新燕', '春泥', '乱花', '浅草', '绿杨', '白沙堤'],
      mood: '明媚生机、春意盎然',
      emotion: '对早春西湖美景的喜爱与流连忘返'
    },
    template: '诗人通过"早莺、新燕、乱花、浅草"等意象，营造出"明媚生机"的早春意境，表达了"对自然美景的喜爱与流连忘返之情"。'
  },
  {
    id: 'p005',
    title: '饮酒·其五',
    author: '陶渊明',
    content: '结庐在人境，而无车马喧。问君何能尔？心远地自偏。采菊东篱下，悠然见南山。山气日夕佳，飞鸟相与还。此中有真意，欲辨已忘言。',
    analysis: {
      imageries: ['菊', '东篱', '南山', '山气', '飞鸟'],
      mood: '恬淡宁静、悠然自得',
      emotion: '超脱世俗、归隐田园的闲适与自由'
    },
    template: '诗人通过"菊、东篱、南山、飞鸟"等意象，营造出"恬淡宁静"的田园意境，表达了"超脱世俗、归隐自然的闲适之情"。'
  },
  {
    id: 'p006',
    title: '登高',
    author: '杜甫',
    content: '风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。',
    analysis: {
      imageries: ['急风', '高天', '猿啸', '落木', '长江', '霜鬓', '浊酒'],
      mood: '苍凉悲壮、沉郁顿挫',
      emotion: '身世飘零的悲苦、老病孤愁的感伤与忧国忧民之情'
    },
    template: '诗人通过"急风、落木、长江、霜鬓"等意象，营造出"苍凉悲壮"的深秋意境，表达了"身世飘零、老病孤愁的深沉悲感"。'
  },
  {
    id: 'p007',
    title: '次北固山下',
    author: '王湾',
    content: '客路青山外，行舟绿水前。潮平两岸阔，风正一帆悬。海日生残夜，江春入旧年。乡书何处达？归雁洛阳边。',
    analysis: {
      imageries: ['青山', '绿水', '行舟', '潮平', '风正', '帆', '海日', '归雁'],
      mood: '开阔明朗中蕴含淡淡乡愁',
      emotion: '旅途中的思乡之情与对新年的期盼'
    },
    template: '诗人通过"青山、绿水、海日、归雁"等意象，在"开阔明朗"的旅途中融入了"思乡盼归"的淡淡愁绪。'
  }
];

// ========== 课后练习数据 ==========
const HOMEWORK_POEMS = [
  {
    id: 'h001',
    title: '枫桥夜泊',
    author: '张继',
    content: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。',
    questions: { imageries: '月落、乌啼、霜、江枫、渔火、钟声、客船', mood: '清冷孤寂', emotion: '羁旅之愁' }
  },
  {
    id: 'h002',
    title: '山行',
    author: '杜牧',
    content: '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。',
    questions: { imageries: '寒山、石径、白云、枫林、霜叶', mood: '明丽绚烂', emotion: '对秋景的喜爱与赞美' }
  },
  {
    id: 'h003',
    title: '泊秦淮',
    author: '杜牧',
    content: '烟笼寒水月笼沙，夜泊秦淮近酒家。商女不知亡国恨，隔江犹唱后庭花。',
    questions: { imageries: '烟、寒水、月、沙、酒家、后庭花', mood: '朦胧凄迷', emotion: '忧国忧民' }
  },
  {
    id: 'h004',
    title: '送杜少府之任蜀州',
    author: '王勃',
    content: '城阙辅三秦，风烟望五津。与君离别意，同是宦游人。海内存知己，天涯若比邻。无为在歧路，儿女共沾巾。',
    questions: { imageries: '城阙、风烟、五津、歧路', mood: '开阔旷达中含离愁', emotion: '送别友人的豁达与勉励' }
  },
  {
    id: 'h005',
    title: '渔家傲',
    author: '范仲淹',
    content: '塞下秋来风景异，衡阳雁去无留意。四面边声连角起，千嶂里，长烟落日孤城闭。浊酒一杯家万里，燕然未勒归无计。羌管悠悠霜满地，人不寐，将军白发征夫泪。',
    questions: { imageries: '雁、边声、千嶂、长烟、落日、孤城、浊酒、羌管、霜', mood: '苍凉悲壮', emotion: '思乡与忧国的矛盾' }
  },
  {
    id: 'h006',
    title: '相见欢',
    author: '李煜',
    content: '无言独上西楼，月如钩。寂寞梧桐深院锁清秋。剪不断，理还乱，是离愁，别是一般滋味在心头。',
    questions: { imageries: '西楼、月如钩、梧桐、深院、清秋', mood: '凄清孤寂', emotion: '亡国之痛与深沉的离愁' }
  },
  {
    id: 'h007',
    title: '望江南',
    author: '温庭筠',
    content: '梳洗罢，独倚望江楼。过尽千帆皆不是，斜晖脉脉水悠悠。肠断白蘋洲。',
    questions: { imageries: '望江楼、千帆、斜晖、水、白蘋洲', mood: '空寂惆怅', emotion: '思妇盼归的失望与绵绵愁绪' }
  },
  {
    id: 'h008',
    title: '竹石',
    author: '郑燮',
    content: '咬定青山不放松，立根原在破岩中。千磨万击还坚劲，任尔东西南北风。',
    questions: { imageries: '青山、破岩、竹、风', mood: '刚劲坚韧', emotion: '不向困难低头的坚贞品格' }
  }
];

// ========== 评价量表 ==========
const EVALUATION_RUBRIC = [
  { dimension: '课前学习', content: '朋友圈任务、资料收集', weight: 20 },
  { dimension: '课堂参与', content: '意象组合挑战赛', weight: 20 },
  { dimension: '合作探究', content: '意象地图', weight: 25 },
  { dimension: '鉴赏能力', content: '陌生诗歌分析', weight: 20 },
  { dimension: '创意表达', content: 'AI诗词海报创作', weight: 15 },
];

// ========== 答题模板 ==========
const ANSWER_TEMPLATE = '诗人通过"××、××、××"等意象，营造出"××"的意境，表达了"××"的情感。';

// ========== AI海报作品展示 ==========
const GALLERY_WORKS = [
  {
    id: 'g001',
    studentName: '李明',
    poem: '静夜思',
    author: '李白',
    content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    imagePrompt: '月夜、窗前、霜白月光、淡墨山水、朦胧月光、中国传统水墨风格、思乡氛围',
    appreciation: '诗人以月光为引，通过"明月"与"故乡"的意象关联，营造出清冷孤寂的月夜意境，表达游子对故乡的深切思念。',
    likes: 28
  },
  {
    id: 'g002',
    studentName: '王芳',
    poem: '江雪',
    author: '柳宗元',
    content: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
    imagePrompt: '雪景、寒江、孤舟、蓑笠老翁、千山寂静、中国传统水墨画风、孤高清冷',
    appreciation: '以"千山""万径"的广阔对比"孤舟""独钓"的渺小，营造出天地苍茫、万籁俱寂的意境，表达诗人虽孤独但不屈的品格。',
    likes: 35
  },
  {
    id: 'g003',
    studentName: '陈强',
    poem: '望岳',
    author: '杜甫',
    content: '岱宗夫如何？齐鲁青未了。造化钟神秀，阴阳割昏晓。荡胸生曾云，决眦入归鸟。会当凌绝顶，一览众山小。',
    imagePrompt: '泰山雄伟、层云缭绕、归鸟高飞、苍松翠柏、中国传统山水画风、雄浑壮阔',
    appreciation: '以"曾云""归鸟""绝顶"等意象，营造出泰山雄伟壮阔的意境，"一览众山小"不仅写山之高，更写诗人胸怀天下的豪情壮志。',
    likes: 22
  },
  {
    id: 'g004',
    studentName: '刘洋',
    poem: '饮酒·其五',
    author: '陶渊明',
    content: '结庐在人境，而无车马喧。采菊东篱下，悠然见南山。',
    imagePrompt: '东篱菊花、远山淡影、茅舍田园、飞鸟归林、中国传统水墨淡彩画风、恬淡宁静',
    appreciation: '"采菊东篱下，悠然见南山"——东篱、菊、南山构成了一幅淡雅的田园画卷。"悠然"二字道出了诗人超脱世俗、回归自然的闲适心境。',
    likes: 19
  },
  {
    id: 'g005',
    studentName: '赵敏',
    poem: '枫桥夜泊',
    author: '张继',
    content: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。',
    imagePrompt: '寒夜江边、枫桥月色、点点渔火、远处寺庙剪影、中国传统水墨画风、清冷孤寂',
    appreciation: '"月落乌啼霜满天"营造出清冷寂寥的秋夜，"江枫渔火对愁眠"以温暖渔火反衬羁旅之愁，以动衬静，情景交融。',
    likes: 27
  },
  {
    id: 'g006',
    studentName: '周杰',
    poem: '天净沙·秋思',
    author: '马致远',
    content: '枯藤老树昏鸦，小桥流水人家，古道西风瘦马。夕阳西下，断肠人在天涯。',
    imagePrompt: '枯藤缠绕老树、黄昏归鸦、小桥流水村舍、古道西风瘦马、夕阳残照、中国传统水墨画风、萧瑟苍凉',
    appreciation: '全曲仅28字，以十个意象勾勒出一幅秋日黄昏游子图。"断肠人在天涯"收束全篇，所有意象的萧瑟苍凉都汇聚为游子心中的无尽乡愁。',
    likes: 31
  },
  {
    id: 'g007',
    studentName: '匿名同学',
    poem: '春望',
    author: '杜甫',
    content: '国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。',
    imagePrompt: '残破城垣、草木丛生、春花含泪、惊飞鸟群、中国传统水墨画风、荒凉悲怆',
    appreciation: '以"山河在"写国破，以"草木深"写人稀——花鸟本为乐景，在诗人眼中却"溅泪""惊心"，以乐景写哀情，倍增其哀。',
    likes: 24
  },
  {
    id: 'g008',
    studentName: '匿名同学',
    poem: '山行',
    author: '杜牧',
    content: '远上寒山石径斜，白云生处有人家。停车坐爱枫林晚，霜叶红于二月花。',
    imagePrompt: '寒山石径蜿蜒、白云缭绕山腰、枫林如火、霜叶红艳、中国传统青绿山水画风、明丽绚烂',
    appreciation: '"霜叶红于二月花"是全诗的点睛之笔——诗人以秋日枫叶的绚烂，表现了秋天比春天更动人的生命力，传达出积极乐观的人生态度。',
    likes: 18
  }
];
