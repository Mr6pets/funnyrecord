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
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

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

export default function Home() {
  const navigate = useNavigate()
  const { user, profile } = useAuthStore()
  const { records, fetchRecords, createRecord } = useMoodStore()
  const [selectedQuickMood, setSelectedQuickMood] = useState('')

  useEffect(() => {
    if (user) {
      fetchRecords()
    }
  }, [user, fetchRecords])

  const quickMoods = [
    { type: 'happy', emoji: '😊', label: '开心', color: 'bg-yellow-100 hover:bg-yellow-200' },
    { type: 'sad', emoji: '😢', label: '难过', color: 'bg-blue-100 hover:bg-blue-200' },
    { type: 'angry', emoji: '😠', label: '愤怒', color: 'bg-red-100 hover:bg-red-200' },
    { type: 'calm', emoji: '😌', label: '平静', color: 'bg-green-100 hover:bg-green-200' },
    { type: 'excited', emoji: '🤩', label: '兴奋', color: 'bg-orange-100 hover:bg-orange-200' }
  ]

  // 今日记录统计
  const today = new Date()
  const todayRecords = records.filter(record => {
    const recordDate = new Date(record.created_at)
    return recordDate.toDateString() === today.toDateString()
  })

  // 最近7天趋势数据
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const trendData = {
    labels: last7Days.map(date => format(date, 'MM/dd')),
    datasets: [{
      label: '心情指数',
      data: last7Days.map(date => {
        const dayRecords = records.filter(record => {
          const recordDate = new Date(record.created_at)
          return recordDate.toDateString() === date.toDateString()
        })
        if (dayRecords.length === 0) return 0
        const avgIntensity = dayRecords.reduce((sum, record) => sum + record.intensity, 0) / dayRecords.length
        return avgIntensity
      }),
      borderColor: '#F97316',
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      tension: 0.4,
      fill: true
    }]
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
      y: {
        beginAtZero: true,
        max: 5,
        grid: {
          display: false
        },
        ticks: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  const handleQuickRecord = async (moodType: string) => {
    try {
      await createRecord({
        mood_type: moodType as any,
        intensity: 3,
        note: ''
      })
      setSelectedQuickMood(moodType)
      setTimeout(() => setSelectedQuickMood(''), 1000)
    } catch (error) {
      console.error('Quick record error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部问候 */}
      <header className="bg-gradient-to-r from-orange-400 to-pink-400 px-4 py-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">你好，{profile?.name || '朋友'}</h1>
            <p className="text-orange-100 text-sm mt-1">
              {format(today, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6" />
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
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
                className={`p-4 rounded-xl transition-all transform ${
                  selectedQuickMood === mood.type
                    ? 'scale-95 bg-orange-200'
                    : mood.color
                } hover:scale-105`}
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
    </div>
  )
}