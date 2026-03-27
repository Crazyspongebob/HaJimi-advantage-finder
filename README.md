# 哈基米优势发现器

## 快速启动

### 1. 配置后端环境变量
```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入你的 API Key
```

### 2. 安装依赖并启动后端
```bash
cd backend && npm install && npm run dev
```

### 3. 安装依赖并启动前端
```bash
cd frontend && npm install && npm run dev
```

### 4. 打开浏览器
```
http://localhost:3000
```

## 演示模式
点击右下角 "演示模式" 按钮可跳过真实 API，直接体验完整流程。

## 切换 LLM 模型
在 `backend/.env` 中修改 `LLM_PROVIDER`:
- `kimi` (月之暗面 Kimi-K2.5)
- `glm-4.7-flash` (智谱 GLM 快速版，推荐)
- `glm-4.7` / `glm-5` (智谱 GLM 标准版)
- `minimax-m2.5` / `minimax-m2.7` (MiniMax)
