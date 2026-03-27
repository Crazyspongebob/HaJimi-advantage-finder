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

### 4. 打开浏览器  前端是3004，后端是5175
```
http://localhost:3004
```

## 演示模式
点击右下角 "演示模式" 按钮可跳过真实 API，直接体验完整流程。

## 切换 LLM 模型
在 `backend/.env` 中修改 `LLM_PROVIDER`:
- `kimi-k2.5` (AIping)

- `glm-4.7` /  (zai)
- `minimax-m2.5` / `glm-5` / 'glm-4.7-flash' (AIping)
- `glm-4.5-air` (zai)
