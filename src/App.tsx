import { useEffect } from 'react'
import Router from './router'
import { useAuthStore } from './store'

function App() {
  const initializeAuth = useAuthStore(state => state.initializeAuth)

  useEffect(() => {
    // 初始化认证状态
    initializeAuth()
  }, [])

  return <Router />
}

export default App
