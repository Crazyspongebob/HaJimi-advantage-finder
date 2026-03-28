// 应用根组件 - 路由配置
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ChatProvider } from './context/ChatContext'
import { DemoModeProvider } from './context/DemoModeContext'
import WelcomePage from './pages/WelcomePage'
import ChatAssessmentPage from './pages/ChatAssessmentPage'
import ResultsPage from './pages/ResultsPage'
import DomainSelectionPage from './pages/DomainSelectionPage'
import JobRecommendationPage from './pages/JobRecommendationPage'
function App() {
  return (
    // 演示模式 Provider 包裹最外层
    <DemoModeProvider>
      {/* 聊天状态 Provider */}
      <ChatProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-hakimi-bg">
            <Routes>
              {/* 欢迎页 */}
              <Route path="/" element={<WelcomePage />} />
              {/* 聊天评估页 */}
              <Route path="/chat" element={<ChatAssessmentPage />} />
              {/* 结果展示页 */}
              <Route path="/results" element={<ResultsPage />} />
              {/* 领域选择页 */}
              <Route path="/domain" element={<DomainSelectionPage />} />
              {/* 职位推荐页 */}
              <Route path="/jobs" element={<JobRecommendationPage />} />
              {/* 未匹配路径重定向到首页 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </ChatProvider>
    </DemoModeProvider>
  )
}

export default App
