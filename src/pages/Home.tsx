import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, TrendingUp, Calendar, Heart } from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useMoodStore, useAuthStore } from '../store'
import { format, isToday, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const Home = () => {
  const { user } = useAuthStore()
  const { records, fetchRecords, createRecord } = useMoodStore()
  const navigate = useNavigate()
  const [selectedQuickMood, setSelectedQuickMood] = useState<string | null>(null)
  
  // 检查是否为体验模式
  const isExperienceMode = localStorage.getItem('experience_mode') === 'true'

  useEffect(() => {
    fetchRecords()
  }, [])

  // 快速心情选项
  const quickMoods = [
    { type: 'happy', emoji: '😊', label: '开心', color: 'bg-yellow-100 hover:bg-yellow-200' },
    { type: 'sad', emoji: '😢', label: '难过', color: 'bg-blue-100 hover:bg-blue-200' },
    { type: 'angry', emoji: '😠', label: '愤怒', color: 'bg-red-100 hover:bg-red-200' },
    { type: 'anxious', emoji: '😰', label: '焦虑', color: 'bg-orange-100 hover:bg-orange-200' },
    { type: 'calm', emoji: '😌', label: '平静', color: 'bg-green-100 hover:bg-green-200' }
  ]

  // 快速记录心情
  const handleQuickRecord = async (moodType: string) => {
    try {
      setSelectedQuickMood(moodType)
      
      const newRecord = {
        mood_type: moodType as any,
        intensity: 5, // 默认强度
        note: ''
      }
      
      await createRecord(newRecord)
      toast.success('心情记录成功！')
      
      // 重置选中状态
      setTimeout(() => {
        setSelectedQuickMood(null)
      }, 500)
    } catch (error) {
      console.error('Quick record error:', error)
      toast.error('记录失败，请重试')
      setSelectedQuickMood(null)
    }
  }

  // 获取今日记录
  const todayRecords = records.filter(record => 
    isToday(new Date(record.created_at))
  )

  // 获取7天数据用于趋势图
  const getLast7DaysData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i)
      const dayRecords = records.filter(record => 
        format(new Date(record.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      )
      const avgIntensity = dayRecords.length > 0 
        ? dayRecords.reduce((sum, r) => sum + r.intensity, 0) / dayRecords.length 
        : 0
      
      return {
        date: format(date, 'MM/dd'),
        value: avgIntensity
      }
    })
    
    return last7Days
  }

  const trendData = {
    labels: getLast7DaysData().map(d => d.date),
    datasets: [
      {
        label: '心情指数',
        data: getLast7DaysData().map(d => d.value),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        display: false
      },
      y: {
        display: false,
        min: 0,
        max: 10
      }
    },
    elements: {
      point: {
        radius: 3
      }
    }
  }

  const getUserGreeting = () => {
    if (isExperienceMode) {
      return '欢迎体验心情日记！'
    }
    
    const localUser = localStorage.getItem('current_user')
    if (localUser) {
      const userData = JSON.parse(localUser)
      return `你好，${userData.username || '朋友'}！`
    }
    
    if (user?.email) {
      return `你好，${user.email.split('@')[0]}！`
    }
    
    return '你好！'
  }

  return (
    <div className="p-4 space-y-6">
      {/* 体验模式提示 */}
      {isExperienceMode && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-medium text-green-800 mb-1">
                欢迎使用体验模式！
              </h3>
              <p className="text-sm text-green-700 mb-2">
                您正在使用完整功能版本，所有数据都安全保存在您的设备上。
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  ✅ 记录心情
                </span>
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  ✅ 查看统计
                </span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  ✅ 管理标签
                </span>
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  ✅ 数据备份
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 问候语 */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {getUserGreeting()}
        </h1>
        <p className="text-gray-600">
          {isExperienceMode 
            ? '开始记录您的美好心情吧～' 
            : '今天的心情如何？'
          }
        </p>
      </div>

      {/* 快速记录 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">快速记录心情</h2>
          <button
            onClick={() => navigate('/record')}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600 transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-medium">详细记录</span>
          </button>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          {quickMoods.map((mood) => (
            <button
              key={mood.type}
              onClick={() => handleQuickRecord(mood.type)}
              disabled={selectedQuickMood === mood.type}
              className={`p-4 rounded-xl transition-all transform ${
                selectedQuickMood === mood.type
                  ? 'scale-95 bg-orange-200'
                  : mood.color
              } hover:scale-105 disabled:opacity-50`}
            >
              <div className="text-2xl mb-2">{mood.emoji}</div>
              <div className="text-xs font-medium text-gray-600">{mood.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 今日概览 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">今日概览</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-800">{todayRecords.length}</p>
                <p className="text-sm text-blue-600">今日记录</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800">
                  {todayRecords.length > 0 
                    ? (todayRecords.reduce((sum, r) => sum + r.intensity, 0) / todayRecords.length).toFixed(1)
                    : '0.0'
                  }
                </p>
                <p className="text-sm text-green-600">平均心情</p>
              </div>
            </div>
          </div>
        </div>
        
        {todayRecords.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">最近记录：</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {quickMoods.find(m => m.type === todayRecords[0]?.mood_type)?.emoji || '😊'}
              </span>
              <span className="text-sm text-gray-800">
                {format(new Date(todayRecords[0]?.created_at), 'HH:mm')}
              </span>
              {todayRecords[0]?.note && (
                <span className="text-sm text-gray-600 truncate">
                  - {todayRecords[0].note}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 心情趋势 */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">7天趋势</h2>
          <button
            onClick={() => navigate('/stats')}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium transition-colors"
          >
            查看详情
          </button>
        </div>
        
        <div className="h-32">
          <Line data={trendData} options={chartOptions} />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>7天前</span>
          <span>今天</span>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/history')}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-purple-500" />
            </div>
            <p className="font-medium text-gray-800">查看历史</p>
            <p className="text-xs text-gray-500 mt-1">浏览过往记录</p>
          </div>
        </button>
        
        <button
          onClick={() => navigate('/stats')}
          className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
            </div>
            <p className="font-medium text-gray-800">数据统计</p>
            <p className="text-xs text-gray-500 mt-1">分析心情变化</p>
          </div>
        </button>
      </div>
    </div>
  )
}

export default Home