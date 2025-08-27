import { useEffect } from 'react'
import Router from './router'
import { useAuthStore } from './store'
import { Toaster } from 'sonner'

function App() {
  const initializeAuth = useAuthStore(state => state.initializeAuth)

  useEffect(() => {
    // 初始化认证状态
    initializeAuth()
  }, [])

  return (
    <>
      <Router />
      <Toaster 
        position="top-center"
        richColors
        closeButton
        duration={3000}
      />
    </>
  )
}

export default App
