// 盖洛普优势题库服务
// 从 Gallup_Strengths_Bank 加载题库，构建增强版对话提示词

const fs = require('fs');
const path = require('path');

// 题库根目录（相对于 backend/services/，向上两级到项目根目录）
const BANK_ROOT = path.resolve(__dirname, '../..', 'Gallup_Strengths_Bank');

// 34个才干主题的映射（英文名 → 中文名 + 领域）
const THEME_MAP = {
  Achiever:       { zh: '成就', domain: 'execution' },
  Activator:      { zh: '行动', domain: 'influence' },
  Adaptability:   { zh: '适应', domain: 'relationship' },
  Analytical:     { zh: '分析', domain: 'strategic' },
  Arranger:       { zh: '统筹', domain: 'execution' },
  Belief:         { zh: '信仰', domain: 'execution' },
  Command:        { zh: '统率', domain: 'influence' },
  Communication:  { zh: '沟通', domain: 'influence' },
  Competition:    { zh: '竞争', domain: 'influence' },
  Connectedness:  { zh: '关联', domain: 'relationship' },
  Consistency:    { zh: '公平', domain: 'execution' },
  Context:        { zh: '历史', domain: 'strategic' },
  Deliberative:   { zh: '审慎', domain: 'execution' },
  Developer:      { zh: '伯乐', domain: 'relationship' },
  Discipline:     { zh: '纪律', domain: 'execution' },
  Empathy:        { zh: '体谅', domain: 'relationship' },
  Focus:          { zh: '专注', domain: 'execution' },
  Futuristic:     { zh: '前瞻', domain: 'strategic' },
  Harmony:        { zh: '和谐', domain: 'relationship' },
  Ideation:       { zh: '思维', domain: 'strategic' },
  Includer:       { zh: '包容', domain: 'relationship' },
  Individualization: { zh: '个别', domain: 'relationship' },
  Input:          { zh: '搜集', domain: 'strategic' },
  Intellection:   { zh: '思虑', domain: 'strategic' },
  Learner:        { zh: '学习', domain: 'strategic' },
  Maximizer:      { zh: '完美', domain: 'influence' },
  Positivity:     { zh: '积极', domain: 'relationship' },
  Relator:        { zh: '交往', domain: 'relationship' },
  Responsibility: { zh: '责任', domain: 'execution' },
  Restorative:    { zh: '修复', domain: 'execution' },
  Self_Assurance: { zh: '自信', domain: 'influence' },
  Significance:   { zh: '渴望', domain: 'influence' },
  Strategic:      { zh: '战略', domain: 'strategic' },
  Woo:            { zh: '取悦', domain: 'influence' },
};

/**
 * 从单个维度 md 文件中提取 Mode A 问题
 * @param {string} content - 文件内容
 * @param {string} eduLevel - 'ug' | 'pg'
 * @returns {string[]} 提取的问题列表
 */
function extractModeAQuestions(content, eduLevel) {
  const section = eduLevel === 'pg' ? 'PG Scenario' : 'UG Scenario';
  const sectionRegex = new RegExp(`### ${section}[\\s\\S]*?(?=### |## |$)`, 'i');
  const match = content.match(sectionRegex);
  if (!match) return [];

  const questions = [];
  // Matches: "- **Topic N:**" or "- **Question N:**" or "- **QN:**"
  const qRegex = /- \*\*(?:Topic|Question|Q)\s*\d*:?\*\*\s*[""""]?(.+?)(?:\s*`\[Signal[^\n]*)?[""""]?\s*$/gm;
  let m;
  while ((m = qRegex.exec(match[0])) !== null) {
    const q = m[1].replace(/`\[Signal[^\]]*\]`?/g, '').replace(/[""""`]/g, '').trim();
    if (q.length > 10) questions.push(q);
  }
  return questions;
}

/**
 * 从单个维度 md 文件中提取 Mode B 量表语句
 * @param {string} content - 文件内容
 * @returns {{ statements: string[], reverseIndices: number[] }}
 */
function extractModeBStatements(content) {
  const sectionRegex = /## \[Mode B\][^]*?(?=## |$)/i;
  const match = content.match(sectionRegex);
  if (!match) return { statements: [], reverseIndices: [] };

  const statements = [];
  const reverseIndices = [];
  const stRegex = /^\d+\.\s+(.+)/gm;
  let m;
  while ((m = stRegex.exec(match[0])) !== null) {
    let raw = m[1].trim();
    const isReverse = /\(反向\)/.test(raw);
    if (isReverse) {
      reverseIndices.push(statements.length);
      raw = raw.replace(/\(反向\)\s*/g, '').trim();
    }
    const s = raw.replace(/\s*\[\s*\]\s*$/, '').replace(/[^\x00-\x7F\u4e00-\u9fff\u3000-\u303f\uff00-\uffef，。？！、：；""''（）【】…]/g, '').trim();
    if (s.length > 5) statements.push(s);
  }
  return { statements, reverseIndices };
}

// 缓存解析结果
let _parsedBank = null;

/**
 * 解析题库（懒加载 + 缓存）
 * @returns {object} 解析后的题库
 */
function parseBank() {
  if (_parsedBank) return _parsedBank;

  const dimensions = {};

  try {
    const files = fs.readdirSync(path.join(BANK_ROOT, 'dimensions'))
      .filter(f => f.endsWith('.md'))
      .sort();

    for (const file of files) {
      const nameMatch = file.match(/^\d+_(.+)\.md$/);
      if (!nameMatch) continue;

      const themeName = nameMatch[1]; // e.g. "Achiever"
      const themeKey = themeName.replace(/_/g, ' ');
      const info = THEME_MAP[themeName] || { zh: themeName, domain: 'strategic' };

      try {
        const content = fs.readFileSync(path.join(BANK_ROOT, 'dimensions', file), 'utf8');
        const { statements, reverseIndices } = extractModeBStatements(content);
        dimensions[themeName] = {
          name: themeName,
          zh: info.zh,
          domain: info.domain,
          ugQuestions: extractModeAQuestions(content, 'ug'),
          pgQuestions: extractModeAQuestions(content, 'pg'),
          scaleStatements: statements,
          scaleReverseIndices: reverseIndices,
        };
      } catch (e) {
        // 单个文件读取失败不影响整体
      }
    }
  } catch (e) {
    console.warn('[GallupService] 题库目录读取失败，将使用内置问题：', e.message);
  }

  _parsedBank = dimensions;
  return dimensions;
}

/**
 * 构建用于注入系统提示词的题库摘要
 * 只取每个维度的前2个 chatty 问题，控制 token 量
 * @param {string} eduLevel - 'ug' | 'pg'
 * @returns {string}
 */
function buildBankSummary(eduLevel = 'ug') {
  const bank = parseBank();
  const themes = Object.values(bank);
  if (themes.length === 0) return '';

  const domainGroups = { execution: [], influence: [], relationship: [], strategic: [] };
  for (const t of themes) {
    const questions = eduLevel === 'pg' ? t.pgQuestions : t.ugQuestions;
    if (questions.length > 0) {
      const entry = `  【${t.zh}】${questions.slice(0, 2).join(' / ')}`;
      domainGroups[t.domain]?.push(entry);
    }
  }

  const lines = [];
  const domainNames = { execution: '执行力', influence: '影响力', relationship: '关系建立', strategic: '战略思维' };
  for (const [domain, entries] of Object.entries(domainGroups)) {
    if (entries.length > 0) {
      lines.push(`\n### ${domainNames[domain]}（${domain}）`);
      lines.push(...entries);
    }
  }
  return lines.join('\n');
}

/**
 * 获取某个才干的量表题（Mode B），用于深度验证
 * @param {string} themeEn - 英文才干名（如 "Achiever"）
 * @returns {string[]}
 */
function getScaleStatements(themeEn) {
  const bank = parseBank();
  return bank[themeEn]?.scaleStatements || [];
}

/**
 * 获取完整题库对象
 */
function getBank() {
  return parseBank();
}

/**
 * 返回题库加载状态摘要（用于健康检查/日志）
 */
function getBankStatus() {
  const bank = parseBank();
  const count = Object.keys(bank).length;
  return { loaded: count > 0, themeCount: count, bankRoot: BANK_ROOT };
}

/**
 * Returns the ordered list of 34 theme names for assessment
 * Ordered by domain for balanced coverage: execution, influence, relationship, strategic
 */
function getThemeOrder() {
  return [
    'Achiever', 'Command', 'Adaptability', 'Analytical',
    'Arranger', 'Communication', 'Connectedness', 'Context',
    'Belief', 'Competition', 'Developer', 'Deliberative',
    'Consistency', 'Activator', 'Empathy', 'Focus',
    'Discipline', 'Maximizer', 'Harmony', 'Futuristic',
    'Responsibility', 'Significance', 'Includer', 'Ideation',
    'Restorative', 'Self_Assurance', 'Individualization', 'Input',
    'Strategic', 'Woo', 'Positivity', 'Intellection',
    'Relator', 'Learner',
  ];
}

/**
 * Get chatty seeds for a specific theme and edu level
 * Seeds are the questions extracted by gallupService from dimension files
 * @param {string} themeEn - English theme name (e.g. "Achiever")
 * @param {string} eduLevel - 'ug' | 'pg'
 * @returns {string[]} array of seed questions
 */
function getSeedsForTheme(themeEn, eduLevel = 'ug') {
  const bank = parseBank();
  const theme = bank[themeEn];
  if (!theme) return [];
  return eduLevel === 'pg' ? (theme.pgQuestions || []) : (theme.ugQuestions || []);
}

/**
 * Get scale (Likert 1-5) statements for a theme
 */
function getScaleQuestionsForTheme(themeEn) {
  const bank = parseBank();
  return bank[themeEn]?.scaleStatements || [];
}

/**
 * Get reverse indices for scale statements of a theme
 */
function getScaleReverseIndicesForTheme(themeEn) {
  const bank = parseBank();
  return bank[themeEn]?.scaleReverseIndices || [];
}

/**
 * Get theme info (Chinese name + domain)
 */
function getThemeInfo(themeEn) {
  const bank = parseBank();
  const t = bank[themeEn];
  if (!t) return { zh: themeEn, domain: 'strategic' };
  return { zh: t.zh, domain: t.domain };
}

module.exports = {
  buildBankSummary,
  getScaleStatements,
  getBank,
  getBankStatus,
  getThemeOrder,
  getSeedsForTheme,
  getScaleQuestionsForTheme,
  getScaleReverseIndicesForTheme,
  getThemeInfo,
};
