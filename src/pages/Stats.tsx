import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, PieChart, Calendar, Award } from 'lucide-react'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import { useMoodStore } from '../store'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
)

const Stats = () => {
  const { records, fetchRecords } = useMoodStore()
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week')

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // 根据时间范围过滤记录
  const filteredRecords = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (timeRange) {
      case 'week':
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'year':
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      default:
        startDate = subDays(now, 7)
    }

    return records.filter(record => {
      const recordDate = new Date(record.created_at)
      return recordDate >= startDate && recordDate <= endDate
    })
  }, [records, timeRange])

  // 计算统计数据
  const moodDistribution = useMemo(() => {
    const moodCounts = filteredRecords.reduce((acc, record) => {
      acc[record.mood_type] = (acc[record.mood_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const moodLabels = {
      happy: '开心',
      sad: '难过',
      angry: '愤怒',
      anxious: '焦虑',
      calm: '平静',
      excited: '兴奋',
      tired: '疲惫',
      confused: '困惑'
    }

    const colors = {
      happy: { bg: '#FEF3C7', border: '#F59E0B' },
      sad: { bg: '#DBEAFE', border: '#3B82F6' },
      angry: { bg: '#FEE2E2', border: '#EF4444' },
      anxious: { bg: '#DDD6FE', border: '#8B5CF6' },
      calm: { bg: '#D1FAE5', border: '#10B981' },
      excited: { bg: '#FED7AA', border: '#F97316' },
      tired: { bg: '#E5E7EB', border: '#6B7280' },
      confused: { bg: '#E0E7FF', border: '#6366F1' }
    }

    const labels = Object.keys(moodCounts).map(mood => moodLabels[mood as keyof typeof moodLabels] || mood)
    const data = Object.values(moodCounts)
    const backgroundColors = Object.keys(moodCounts).map(mood => colors[mood as keyof typeof colors]?.bg || '#E5E7EB')
    const borderColors = Object.keys(moodCounts).map(mood => colors[mood as keyof typeof colors]?.border || '#6B7280')

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2
      }]
    }
  }, [filteredRecords])

  const moodTrend = useMemo(() => {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365
    const labels = []
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const dayRecords = filteredRecords.filter(record => {
        const recordDate = new Date(record.created_at)
        return recordDate.toDateString() === date.toDateString()
      })

      if (timeRange === 'week') {
        labels.push(format(date, 'EEE'))
      } else if (timeRange === 'month') {
        labels.push(format(date, 'MM/dd'))
      } else {
        labels.push(format(date, 'MM月'))
      }

      const avgIntensity = dayRecords.length > 0 
        ? dayRecords.reduce((sum, record) => sum + record.intensity, 0) / dayRecords.length
        : 0
      data.push(avgIntensity)
    }

    return {
      labels,
      datasets: [{
        label: '心情指数',
        data,
        borderColor: '#F97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true
      }]
    }
  }, [filteredRecords, timeRange])

  const tagFrequency = useMemo(() => {
    // TODO: 实现标签频率统计 - 需要标签关联数据
    return {
      labels: ['工作', '生活', '运动', '学习', '社交'],
      datasets: [{
        label: '使用次数',
        data: [0, 0, 0, 0, 0], // 暂时使用空数据
        backgroundColor: '#F97316',
        borderRadius: 8
      }]
    }
  }, [filteredRecords])

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
        grid: {
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  }

  const stats = useMemo(() => {
    const totalRecords = filteredRecords.length
    const averageMood = totalRecords > 0 
      ? filteredRecords.reduce((sum, record) => sum + record.intensity, 0) / totalRecords
      : 0
    
    // 计算最常见的心情
    const moodCounts = filteredRecords.reduce((acc, record) => {
      acc[record.mood_type] = (acc[record.mood_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const mostFrequentMoodType = Object.keys(moodCounts).reduce((a, b) => 
      moodCounts[a] > moodCounts[b] ? a : b, 'happy'
    )
    
    const moodLabels = {
      happy: '开心',
      sad: '难过',
      angry: '愤怒',
      anxious: '焦虑',
      calm: '平静',
      excited: '兴奋',
      tired: '疲惫',
      confused: '困惑'
    }
    
    const mostFrequentMood = moodLabels[mostFrequentMoodType as keyof typeof moodLabels] || '开心'
    
    // 计算连续记录天数
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) { // 检查最近30天
      const checkDate = subDays(today, i)
      const hasRecord = sortedRecords.some(record => {
        const recordDate = new Date(record.created_at)
        return recordDate.toDateString() === checkDate.toDateString()
      })
      
      if (hasRecord) {
        streak++
      } else if (i > 0) { // 如果不是今天且没有记录，则中断
        break
      }
    }
    
    return {
      totalRecords,
      averageMood: Number(averageMood.toFixed(1)),
      mostFrequentMood,
      streak
    }
  }, [filteredRecords, records])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-800">心情统计</h1>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="year">本年</option>
          </select>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* 概览卡片 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRecords}</p>
                <p className="text-sm text-gray-500">总记录数</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.averageMood}</p>
                <p className="text-sm text-gray-500">平均心情</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">😊</span>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{stats.mostFrequentMood}</p>
                <p className="text-sm text-gray-500">最常心情</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.streak}</p>
                <p className="text-sm text-gray-500">连续天数</p>
              </div>
            </div>
          </div>
        </div>

        {/* 心情趋势图 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">心情趋势</h2>
          <div className="h-64">
            <Line data={moodTrend} options={chartOptions} />
          </div>
        </div>

        {/* 心情分布 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">心情分布</h2>
          <div className="h-64">
            <Doughnut data={moodDistribution} options={doughnutOptions} />
          </div>
        </div>

        {/* 标签使用频率 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">标签使用频率</h2>
          <div className="h-64">
            <Bar data={tagFrequency} options={chartOptions} />
          </div>
        </div>

        {/* 周期报告 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">本周报告</h2>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h3 className="font-medium text-orange-800 mb-2">✨ 积极发现</h3>
              <p className="text-orange-700 text-sm">
                本周你的心情整体呈上升趋势，周末的心情指数达到了4.8分，说明你很好地平衡了工作和生活。
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">📊 数据洞察</h3>
              <p className="text-blue-700 text-sm">
                "工作"标签使用最频繁，建议在工作之余多安排一些放松活动，保持心情平衡。
              </p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">💡 建议</h3>
              <p className="text-green-700 text-sm">
                继续保持记录习惯！你已经连续记录了7天，这对了解自己的情绪模式很有帮助。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Stats