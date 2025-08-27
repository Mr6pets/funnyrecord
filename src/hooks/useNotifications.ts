import { useState, useEffect } from 'react'

interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  tag?: string
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // 检查浏览器是否支持通知
    setIsSupported('Notification' in window)
    
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // 请求通知权限
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('浏览器不支持通知功能')
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.error('请求通知权限失败:', error)
      return 'denied'
    }
  }

  // 发送通知
  const sendNotification = async (options: NotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      console.warn('浏览器不支持通知功能')
      return false
    }

    // 如果没有权限，先请求权限
    let currentPermission = permission
    if (currentPermission === 'default') {
      currentPermission = await requestPermission()
    }

    if (currentPermission !== 'granted') {
      console.warn('通知权限被拒绝')
      return false
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.svg',
        tag: options.tag,
        requireInteraction: false,
        silent: false
      })

      // 自动关闭通知
      setTimeout(() => {
        notification.close()
      }, 5000)

      return true
    } catch (error) {
      console.error('发送通知失败:', error)
      return false
    }
  }

  // 发送心情提醒通知
  const sendMoodReminder = () => {
    return sendNotification({
      title: '心情日记提醒',
      body: '记得记录今天的心情哦！让美好的时光不被遗忘 ✨',
      tag: 'mood-reminder'
    })
  }

  // 发送每日总结通知
  const sendDailySummary = (recordCount: number) => {
    return sendNotification({
      title: '今日心情总结',
      body: `今天你记录了 ${recordCount} 条心情，继续保持这个好习惯！`,
      tag: 'daily-summary'
    })
  }

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
    sendMoodReminder,
    sendDailySummary
  }
}