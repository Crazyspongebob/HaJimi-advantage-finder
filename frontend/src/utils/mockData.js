// 模拟数据文件 - 演示模式时使用
// 包含哈基米语录和完整的模拟 API 响应

// 哈基米励志语录（10条，猫咪主题，幽默+激励）
export const hakimiQuotes = [
  '喵~ 每只猫都有自己的地盘，你的优势就是你的地盘！',
  '不是所有的鱼都一样好吃，但你一定有最适合你的那条！',
  '猫咪不需要学汪汪叫，你也不需要模仿别人的闪光点！',
  '哈基米小课堂：认识自己的才干，比囤猫粮更重要喵~',
  '贴贴~ 每个人都是独一无二的奇妙猫咪，发现你的魔法了吗？',
  '猫咪打盹也是在思考人生，你的才干就在不经意间闪光！🌟',
  '喵~ 老虎不发猫咪你不知道，你的潜力比你想象的大多了！',
  '就像猫咪找到最舒适的阳光角落，找到你的才干就是找到你的位置！',
  '贴贴贴贴~ 5分钟和哈基米聊聊，比自我怀疑一整年更有用！🐾',
  '猫有九条命，你有无限可能！先来发现你最闪耀的那个才干吧！',
]

// 模拟聊天消息流程
export const mockMessages = [
  {
    role: 'assistant',
    content: '喵~ 你好呀！我是哈基米猫🐱，专门帮助大家发现自己的天赋优势！\n\n接下来我们来一场轻松的闲聊，大概5分钟左右，我会通过几个有趣的问题，帮你发现隐藏在日常生活中的才干哦！\n\n先来个暖场：上一次你做某件事感觉特别"顺"、特别有成就感是什么时候？随便聊聊就好~',
    timestamp: '2026-03-27T10:00:00.000Z',
  },
  {
    role: 'user',
    content: '上周我帮同事整理了一个项目方案，把乱七八糟的需求梳理得很清楚，大家都说一下子明白了，我自己也觉得很有成就感。',
    timestamp: '2026-03-27T10:01:00.000Z',
  },
  {
    role: 'assistant',
    content: '哇！这个细节很有意思喵~ 🐾\n\n"把乱七八糟的需求梳理清楚"——这背后其实有一种特别厉害的才能：你能在混乱中看到结构，找到逻辑关系。不是每个人都有这种能力的！\n\n再问你一个：在朋友或同事遇到困难的时候，你更倾向于做什么？A. 帮他们分析问题，找出根本原因 B. 直接安慰他们，让他们感觉好一点 C. 开始规划解决步骤，马上行动 D. 把大家召集起来一起讨论？',
    timestamp: '2026-03-27T10:02:00.000Z',
  },
]

// 模拟才干分析结果
export const mockAnalysisResults = {
  sessionId: 'demo-session-001',
  topTalents: [
    {
      rank: 1,
      name: '统筹',
      englishName: 'Arranger',
      domain: 'execution',
      domainName: '执行力',
      description: '你能够同时协调多个变量，在复杂的情况中找到最优配置。就像一个指挥家，能让每个部分和谐运转。',
      evidence: '你在项目整理中展现出把混乱转化为秩序的天然能力，并且享受这个过程。',
      score: 92,
    },
    {
      rank: 2,
      name: '分析',
      englishName: 'Analytical',
      domain: 'strategic',
      domainName: '战略思维',
      description: '你喜欢深究原因，不满足于表面答案。你需要数据和证据支撑，才能真正信服一个结论。',
      evidence: '面对朋友困难时，你会优先帮助分析问题根本原因，体现了分析型思维。',
      score: 88,
    },
    {
      rank: 3,
      name: '责任',
      englishName: 'Responsibility',
      domain: 'execution',
      domainName: '执行力',
      description: '你对自己承诺的事情有强烈的使命感，一旦答应就一定会做到，这让你非常值得信赖。',
      evidence: '你主动帮同事整理方案，并且做到让所有人都满意，体现了强烈的责任感。',
      score: 85,
    },
    {
      rank: 4,
      name: '关联',
      englishName: 'Connectedness',
      domain: 'relationship',
      domainName: '关系建立',
      description: '你相信万事万物都有深刻联系，这种视角让你能够将看似不相关的想法或人们联结起来。',
      evidence: '你能看到项目各需求之间的内在逻辑关联，这是关联才干的体现。',
      score: 80,
    },
    {
      rank: 5,
      name: '沟通',
      englishName: 'Communication',
      domain: 'influence',
      domainName: '影响力',
      description: '你天生善于将想法转化成生动的语言或故事，让他人轻松理解复杂的概念。',
      evidence: '你整理的方案让"大家都一下子明白了"，说明你有将复杂变简单的沟通能力。',
      score: 78,
    },
  ],
  domainScores: {
    execution: 75,
    influence: 60,
    relationship: 55,
    strategic: 70,
  },
  summary: '你是一个执行力与战略思维兼备的人才！喵~ 你不仅能制定清晰的计划，还能把计划切实落地。在团队中，你往往是那个把想法变成现实的关键人物。🐾',
}

// 模拟职位推荐结果
export const mockJobRecommendations = {
  jobs: [
    {
      title: '产品经理',
      companyType: '互联网/科技公司',
      matchedTalents: ['统筹', '分析', '沟通'],
      reason: '产品经理需要协调多方需求（统筹），深入理解用户问题（分析），并清晰传达产品方向（沟通）。你的才干组合让你天然适合这个角色，可以在产品规划和执行中发挥巨大价值。',
      growthPath: '初级PM → 资深PM → 产品总监',
    },
    {
      title: '项目管理专员/PMP',
      companyType: '咨询/各行业企业',
      matchedTalents: ['统筹', '责任', '分析'],
      reason: '项目管理本质上就是在多变量中寻找最优解——这正是你统筹才干的舞台。加上你强烈的责任感和分析能力，能确保项目按时、高质量交付。',
      growthPath: '项目专员 → 项目经理 → PMO负责人',
    },
    {
      title: '商业分析师',
      companyType: '金融/咨询公司',
      matchedTalents: ['分析', '沟通', '关联'],
      reason: '商业分析师需要深挖数据背后的洞察（分析），并将复杂发现清晰呈现给决策层（沟通）。你能看到不同业务模块之间的关联，这让你的分析更有深度和全局视野。',
      growthPath: '分析师 → 高级分析师 → 咨询顾问',
    },
    {
      title: '运营总监/运营经理',
      companyType: '互联网/电商公司',
      matchedTalents: ['统筹', '责任', '沟通'],
      reason: '运营工作需要同时推进多个项目线（统筹），对结果负责（责任），并频繁与各方沟通协调（沟通）。你的执行力导向才干让你在运营岗位上如鱼得水。',
      growthPath: '运营专员 → 运营经理 → 运营总监',
    },
    {
      title: '战略规划专员',
      companyType: '大型企业集团',
      matchedTalents: ['分析', '关联', '统筹'],
      reason: '战略规划需要分析行业趋势和内外部数据，看清各要素的关联，制定可执行的方向。你的分析+关联+统筹组合让你能够从混沌中提炼出清晰的战略路径。',
      growthPath: '战略专员 → 战略经理 → 战略总监',
    },
  ],
  personalityInsight: '你是一个执行力与战略思维兼备的实干家！在团队中，你是那个能把模糊想法变成清晰计划、并一步步落地的关键人物。你对自己承诺的事情有强烈使命感，同时又能看到事物之间深层的逻辑关联。这种组合在职场中非常稀缺，喵~ 🐾',
}

// 演示模式进度模拟序列
export const mockProgressSequence = [
  { execution: 20, influence: 0, relationship: 0, strategic: 10 },
  { execution: 35, influence: 10, relationship: 15, strategic: 20 },
  { execution: 50, influence: 20, relationship: 30, strategic: 40 },
  { execution: 65, influence: 35, relationship: 45, strategic: 55 },
  { execution: 75, influence: 60, relationship: 55, strategic: 70 },
]

// 汇总所有模拟数据
export const mockData = {
  messages: mockMessages,
  analysis: mockAnalysisResults,
  jobs: mockJobRecommendations,
  progressSequence: mockProgressSequence,
}

export default mockData
