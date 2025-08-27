import { useState, useEffect } from 'react'

type Language = 'zh-CN' | 'en-US'

interface Translations {
  [key: string]: {
    'zh-CN': string
    'en-US': string
  }
}

const translations: Translations = {
  // 通用
  'app.name': {
    'zh-CN': '心情日记',
    'en-US': 'Mood Diary'
  },
  'app.slogan': {
    'zh-CN': '记录每一刻的美好心情',
    'en-US': 'Record every beautiful moment'
  },
  
  // 导航
  'nav.home': {
    'zh-CN': '首页',
    'en-US': 'Home'
  },
  'nav.record': {
    'zh-CN': '记录',
    'en-US': 'Record'
  },
  'nav.history': {
    'zh-CN': '历史',
    'en-US': 'History'
  },
  'nav.stats': {
    'zh-CN': '统计',
    'en-US': 'Stats'
  },
  'nav.settings': {
    'zh-CN': '设置',
    'en-US': 'Settings'
  },
  
  // 设置页面
  'settings.title': {
    'zh-CN': '设置',
    'en-US': 'Settings'
  },
  'settings.profile': {
    'zh-CN': '个人信息',
    'en-US': 'Profile'
  },
  'settings.editProfile': {
    'zh-CN': '编辑资料',
    'en-US': 'Edit Profile'
  },
  'settings.appSettings': {
    'zh-CN': '应用设置',
    'en-US': 'App Settings'
  },
  'settings.notifications': {
    'zh-CN': '提醒通知',
    'en-US': 'Notifications'
  },
  'settings.theme': {
    'zh-CN': '主题模式',
    'en-US': 'Theme Mode'
  },
  'settings.language': {
    'zh-CN': '语言设置',
    'en-US': 'Language'
  },
  'settings.dataManagement': {
    'zh-CN': '数据管理',
    'en-US': 'Data Management'
  },
  'settings.exportData': {
    'zh-CN': '导出数据',
    'en-US': 'Export Data'
  },
  'settings.clearData': {
    'zh-CN': '清理数据',
    'en-US': 'Clear Data'
  },
  'settings.other': {
    'zh-CN': '其他',
    'en-US': 'Other'
  },
  'settings.privacy': {
    'zh-CN': '隐私政策',
    'en-US': 'Privacy Policy'
  },
  'settings.logout': {
    'zh-CN': '退出登录',
    'en-US': 'Logout'
  },
  
  // 心情类型
  'mood.happy': {
    'zh-CN': '开心',
    'en-US': 'Happy'
  },
  'mood.sad': {
    'zh-CN': '难过',
    'en-US': 'Sad'
  },
  'mood.angry': {
    'zh-CN': '愤怒',
    'en-US': 'Angry'
  },
  'mood.anxious': {
    'zh-CN': '焦虑',
    'en-US': 'Anxious'
  },
  'mood.calm': {
    'zh-CN': '平静',
    'en-US': 'Calm'
  },
  'mood.excited': {
    'zh-CN': '兴奋',
    'en-US': 'Excited'
  },
  'mood.tired': {
    'zh-CN': '疲惫',
    'en-US': 'Tired'
  },
  'mood.confused': {
    'zh-CN': '困惑',
    'en-US': 'Confused'
  },
  
  // 消息提示
  'message.notificationEnabled': {
    'zh-CN': '通知已开启',
    'en-US': 'Notifications enabled'
  },
  'message.notificationDisabled': {
    'zh-CN': '通知已关闭',
    'en-US': 'Notifications disabled'
  },
  'message.notificationDenied': {
    'zh-CN': '通知权限被拒绝，请在浏览器设置中允许通知',
    'en-US': 'Notification permission denied, please allow notifications in browser settings'
  },
  'message.languageChanged': {
    'zh-CN': '语言已切换为',
    'en-US': 'Language changed to'
  },
  'message.exportSuccess': {
    'zh-CN': '数据导出成功！',
    'en-US': 'Data exported successfully!'
  },
  'message.exportFailed': {
    'zh-CN': '导出失败，请重试',
    'en-US': 'Export failed, please try again'
  },
  'message.clearSuccess': {
    'zh-CN': '数据清理完成',
    'en-US': 'Data cleared successfully'
  },
  'message.clearFailed': {
    'zh-CN': '删除失败，请重试',
    'en-US': 'Delete failed, please try again'
  }
}

export const useI18n = () => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') as Language) || 'zh-CN'
  })

  const t = (key: string): string => {
    return translations[key]?.[language] || key
  }

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  const getLanguageLabel = (lang?: Language): string => {
    const targetLang = lang || language
    return targetLang === 'zh-CN' ? '简体中文' : 'English'
  }

  return {
    language,
    t,
    changeLanguage,
    getLanguageLabel
  }
}