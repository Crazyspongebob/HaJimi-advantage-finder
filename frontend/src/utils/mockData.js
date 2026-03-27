// 模拟数据文件 - 演示模式时使用
// 包含完整的8消息4轮演示对话 + 三层专业报告

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

// ── 演示对话：4轮，带信号标签 ───────────────────────────────

export const demoConversation = [
  // Round 0 → 初始问候（系统自动触发）
  {
    sessionId: 'demo-session-001',
    reply: `喵~ 你好呀！我是哈基米，一只很爱思考的猫猫 🐱\n\n我最近在研究一件事——每个人都有自己独特的天赋，只是有时候需要一只猫猫来帮你发现它喵~\n\n咱们来聊5分钟，我会通过轻松的对话找到你最闪耀的才干！\n\n先说说：**你是本科生还是研究生？** 这样我能用最适合你的方式来聊~`,
    progress: { execution: 0, influence: 0, relationship: 0, strategic: 0 },
    isComplete: false,
    readyForReport: false,
    roundCount: 0,
    mode: 'A',
    currentTheme: null,
    skipDetected: false,
    autoPromptReport: false,
  },
  // Round 1 → 用户说"本科"，哈基米问成就感时刻
  {
    sessionId: 'demo-session-001',
    reply: `本科生！那正好，我有超多有趣的问题给你喵~ 🐾\n\n先来个暖场：上一次你做某件事感觉特别"顺"、完全沉浸其中——是什么时候？不用是什么大事，日常小事也行~`,
    progress: { execution: 20, influence: 0, relationship: 0, strategic: 10 },
    isComplete: false,
    readyForReport: false,
    roundCount: 1,
    mode: 'A',
    currentTheme: 'Achiever',
    skipDetected: false,
    autoPromptReport: false,
  },
  // Round 2 → 用户说项目整理，哈基米问追问
  {
    sessionId: 'demo-session-001',
    reply: `哇！这个细节很有意思喵~ 🐾\n\n"把乱七八糟的需求梳理清楚"——这背后其实有一种特别厉害的才能：你能在混乱中看到结构，找到逻辑关系。\n\n再追问你一个：整理完之后，你会不会觉得——嗯，其实如果当初规划得更好就不用这么费劲了？还是你根本不在乎"当初怎样"，当下把它搞清楚就很满足？`,
    progress: { execution: 40, influence: 10, relationship: 15, strategic: 30 },
    isComplete: false,
    readyForReport: false,
    roundCount: 2,
    mode: 'A',
    currentTheme: 'Analytical',
    skipDetected: false,
    autoPromptReport: false,
  },
  // Round 3 → 用户说"更关注当下"，哈基米提关系建立
  {
    sessionId: 'demo-session-001',
    reply: `喵~ 很有意思！当下把事情搞定就满足——这说明你的驱动力来自"完成"本身，而不是对过去的遗憾。这是很典型的成就导向！\n\n换个角度问你：当你帮同学或朋友解决问题的时候，你更倾向于做什么——直接给建议告诉他怎么做，还是先耐心听他说完，然后再帮他理清思路？`,
    progress: { execution: 55, influence: 20, relationship: 40, strategic: 45 },
    isComplete: false,
    readyForReport: false,
    roundCount: 3,
    mode: 'A',
    currentTheme: 'Empathy',
    skipDetected: false,
    autoPromptReport: false,
  },
  // Round 4 → 最后一轮，AI发现足够信号，自动触发报告
  {
    sessionId: 'demo-session-001',
    reply: `喵~ 你说你会"先听完，再帮他理清思路"——这正是**体谅**才干最典型的特征！你能天然地进入别人的情绪状态，这让你的建议更容易被接受。\n\n我已经对你有了足够的了解啦！✨ 综合你之前提到的：整理项目让你有成就感、关注当下的完成感、以及倾听帮助他人——我能看到你非常清晰的才干组合了喵~ 🐾\n\n**哈基米已经帮你识别出你的核心优势了！** 可以生成你的专属才干报告了~`,
    progress: { execution: 75, influence: 60, relationship: 70, strategic: 65 },
    isComplete: true,
    readyForReport: true,
    roundCount: 4,
    mode: 'A',
    currentTheme: null,
    skipDetected: false,
    autoPromptReport: true,
  },
]

// ── 三层专业报告（与新ResultsPage完全匹配） ────────────────

export const demoFullAnalysis = {
  themes: [
    {
      rank: 1,
      nameZh: '成就',
      nameEn: 'Achiever',
      domain: 'executing',
      tagline: '永不熄灭的内驱之火',
      description: '成就主题的人内心燃烧着一团永不熄灭的火焰，驱动他们不断完成一件又一件事。他们以完成任务为乐，每一个勾掉的待办清单都给他们带来真实的满足感。这种持续的成就驱动力让他们在团队中成为最可靠的执行者。',
      evidence: '当你提到帮同事整理项目方案、"把乱七八糟的需求梳理得很清楚"之后感到充实——这正是成就才干在日常生活中最真实的体现。',
      score: 92,
      toolkit: {
        strength: '主动承担项目中最混乱、最复杂的整理工作，你的完成感会激励整个团队。',
        blindspot: '当下清单永远清不完，可能让你对"休息"感到内疚，注意为自己设置"已完成"的庆祝时刻。',
        action: '今天写下三个本周小目标，完成一项就打个✓',
        hakimiQuote: '喵~ 你就是那种把计划变成现实的猫！记得给自己打个✓🐾',
      },
    },
    {
      rank: 2,
      nameZh: '分析',
      nameEn: 'Analytical',
      domain: 'strategic',
      tagline: '用数据照亮黑暗的眼睛',
      description: '分析主题的人喜欢深究事物的根本原因，他们不满足于表面答案，需要数据和逻辑支撑才能真正信服一个结论。他们是天生的质疑者，但这种质疑不是负面的——而是推动事物走向更精准的力量。',
      evidence: '你在整理项目时"把混乱转化为有逻辑的结构"，并主动帮同事分析问题根本原因，体现了分析型思维的核心特征。',
      score: 88,
      toolkit: {
        strength: '在团队讨论中主动提出"我们有什么数据支持这个结论"，你的分析会显著提升决策质量。',
        blindspot: '过度分析可能导致决策缓慢，练习"80%的信息就够做决定"的思维模式。',
        action: '本周做一个决定前，只允许自己收集3条关键数据',
        hakimiQuote: '喵~ 你的大脑是一台精密仪器，记得也给它充充电🐾',
      },
    },
    {
      rank: 3,
      nameZh: '责任',
      nameEn: 'Responsibility',
      domain: 'executing',
      tagline: '一诺千金的内在使命感',
      description: '责任主题的人对自己承诺的事情有强烈的使命感，一旦答应就一定会做到，哪怕没有人监督。这种内在的诚信感让他们成为团队中最值得信赖的成员，也是他人遇到困难时第一个想到的人。',
      evidence: '你主动帮同事整理方案，并且最终让所有人都"一下子明白了"——这不是被要求的，而是你自然而然去承担的，正是责任才干最真实的表现。',
      score: 85,
      toolkit: {
        strength: '在团队项目中主动认领最关键的交付节点，你的责任感会成为项目成功的定海神针。',
        blindspot: '过强的责任感可能让你默默承受不属于你的压力，学会说"这个我需要支持"。',
        action: '本周识别一件你可以放权给他人的小事，试着授权出去',
        hakimiQuote: '你是团队里那根定海神针！但记得神针也需要休息🐾',
      },
    },
    {
      rank: 4,
      nameZh: '体谅',
      nameEn: 'Empathy',
      domain: 'relationship',
      tagline: '感受他人感受的天赋之眼',
      description: '体谅主题的人天生能够感受到他人的情绪，这不是技能，而是一种自然流露的感知能力。他们在别人说话时能"听到"话语背后的情绪，让对方感到被真正理解，这是建立深度关系的核心才干。',
      evidence: '你说帮助他人时会"先耐心听他说完，再帮他理清思路"——这种先共情再解决的自然顺序，正是体谅才干最典型的行为特征。',
      score: 80,
      toolkit: {
        strength: '在团队冲突中担任调解者角色，你能看到每一方的合理诉求，推动真正的和解。',
        blindspot: '高度共情可能让你承接他人的负面情绪，注意为自己建立情绪"出口"。',
        action: '今天和一个朋友聊聊，只听不建议，纯粹感受',
        hakimiQuote: '你有一双能看见心的眼睛，这很珍贵喵~ 🐾',
      },
    },
    {
      rank: 5,
      nameZh: '沟通',
      nameEn: 'Communication',
      domain: 'influencing',
      tagline: '将想法变成画面的语言魔法',
      description: '沟通主题的人天生善于将想法转化成生动的语言或故事，让他人轻松理解复杂的概念。他们享受表达的过程，能够让枯燥的信息变得引人入胜，是天生的信息转化器。',
      evidence: '你整理的方案让"大家都一下子明白了"——这种将混乱信息清晰呈现的能力，正是沟通才干将复杂化简单的体现。',
      score: 78,
      toolkit: {
        strength: '主动承担团队对外汇报和展示的工作，你能让复杂成果变得人人都能理解。',
        blindspot: '享受表达时注意保留他人发言的空间，沟通是双向的。',
        action: '本周把一个复杂的工作进展用3句话讲给朋友听',
        hakimiQuote: '你是团队里的故事翻译官！把想法变成画面🐾',
      },
    },
  ],
  domainScores: {
    executing: 75,
    influencing: 60,
    relationship: 70,
    strategic: 65,
  },
  domainNarrative: {
    executing: '你在执行域的高分显示出强烈的任务完成驱动力和责任心。这意味着你不只是想要做事，而是真正把事情做完、做好，这在团队中是稀缺的能量。',
    influencing: '你的影响力域得分显示你具备将想法清晰传达的能力。配合你的沟通才干，你能在不需要权威的情况下自然影响他人。',
    relationship: '关系建立域的亮眼表现（体谅才干）让你能与他人建立深度连结。你的团队会因为你的存在感到被理解、被看见。',
    strategic: '战略思维域的分析才干让你具备穿透表象、看清底层逻辑的能力。结合你的执行力，你是少见的"既能想清楚又能做出来"的人。',
  },
  summary: '你是一个执行力与战略思维兼备的实干家！喵~ 你不仅能制定清晰的计划，还能把计划切实落地。在团队中，你往往是那个把混乱变成秩序、把想法变成现实的关键人物，同时你还有温暖的共情力，让你成为真正被信任的伙伴。🐾',
  hakimiVerdict: '喵~ 你就是那种既能想明白又能做出来、还让人感到温暖的稀缺人才！哈基米认证！🐾',
  // backward-compat
  topTalents: null, // 由normalizer填充
}

// 计算 backward-compat alias
demoFullAnalysis.topTalents = demoFullAnalysis.themes

// 演示进度序列（5个检查点）
export const mockProgressSequence = [
  { execution: 0, influence: 0, relationship: 0, strategic: 0 },
  { execution: 20, influence: 0, relationship: 0, strategic: 10 },
  { execution: 40, influence: 10, relationship: 15, strategic: 30 },
  { execution: 55, influence: 20, relationship: 40, strategic: 45 },
  { execution: 75, influence: 60, relationship: 70, strategic: 65 },
]

// 职位推荐（保留原有）
export const mockJobRecommendations = {
  jobs: [
    {
      title: '产品经理',
      companyType: '互联网/科技公司',
      matchedTalents: ['统筹', '分析', '沟通'],
      reason: '产品经理需要协调多方需求（统筹），深入理解用户问题（分析），并清晰传达产品方向（沟通）。你的才干组合让你天然适合这个角色。',
      growthPath: '初级PM → 资深PM → 产品总监',
    },
    {
      title: '项目管理专员',
      companyType: '咨询/各行业企业',
      matchedTalents: ['成就', '责任', '分析'],
      reason: '项目管理本质上就是在多变量中寻找最优解——这正是你成就才干的舞台。加上你强烈的责任感和分析能力，能确保项目按时高质量交付。',
      growthPath: '项目专员 → 项目经理 → PMO负责人',
    },
    {
      title: '商业分析师',
      companyType: '金融/咨询公司',
      matchedTalents: ['分析', '沟通', '责任'],
      reason: '商业分析师需要深挖数据背后的洞察（分析），并清晰呈现给决策层（沟通），你的责任感确保分析质量有保障。',
      growthPath: '分析师 → 高级分析师 → 咨询顾问',
    },
  ],
  personalityInsight: '你是一个执行力与战略思维兼备的实干家，在团队中是那个把模糊想法变成清晰计划并一步步落地的关键人物。喵~ 🐾',
}

// 汇总（向后兼容）
export const mockData = {
  messages: demoConversation.map(d => ({ role: 'assistant', content: d.reply, timestamp: new Date().toISOString() })),
  analysis: demoFullAnalysis,
  jobs: mockJobRecommendations,
  progressSequence: mockProgressSequence,
}

export default mockData
