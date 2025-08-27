import { useState, useEffect } from 'react'
import { Calendar, Clock, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { useMoodStore } from '../store'

const History = () => {
  const { records, fetchRecords } = useMoodStore()
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😠',
    anxious: '😰',
    calm: '😌',
    excited: '🤩',
    tired: '😴',
    confused: '😕'
  }

  const moodColors = {
    happy: 'bg-yellow-100 text-yellow-600',
    sad: 'bg-blue-100 text-blue-600',
    angry: 'bg-red-100 text-red-600',
    anxious: 'bg-purple-100 text-purple-600',
    calm: 'bg-green-100 text-green-600',
    excited: 'bg-orange-100 text-orange-600',
    tired: 'bg-gray-100 text-gray-600',
    confused: 'bg-indigo-100 text-indigo-600'
  }

  const filteredRecords = records.filter(record => {
    const matchesSearch = (record.note || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || record.mood_type === selectedFilter
    return matchesSearch && matchesFilter
  })

  const renderTimelineView = () => (
    <div className="space-y-4">
      {filteredRecords.map((record, index) => (
        <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-4">
            {/* 时间轴线 */}
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${moodColors[record.mood_type as keyof typeof moodColors]}`}>
                <span className="text-lg">{moodEmojis[record.mood_type as keyof typeof moodEmojis]}</span>
              </div>
              {index < filteredRecords.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
              )}
            </div>

            {/* 内容 */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {format(new Date(record.created_at), 'MM月dd日 HH:mm', { locale: zhCN })}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < record.intensity ? 'bg-orange-400' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {record.note && (
                <p className="text-gray-800 mb-3">{record.note}</p>
              )}
              
              {/* TODO: 显示标签 - 需要实现标签关联查询 */}
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-full">
                  {moodEmojis[record.mood_type as keyof typeof moodEmojis]} {record.mood_type}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  const renderCalendarView = () => {
    const today = new Date()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
    
    const days = []
    
    // 空白天数
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>)
    }
    
    // 月份天数
    for (let day = 1; day <= daysInMonth; day++) {
      const dayRecord = records.find(record => {
        const recordDate = new Date(record.created_at)
        return recordDate.getDate() === day && 
               recordDate.getMonth() === today.getMonth() &&
               recordDate.getFullYear() === today.getFullYear()
      })
      
      days.push(
        <div key={day} className="h-12 border border-gray-100 flex flex-col items-center justify-center relative">
          <span className="text-sm text-gray-600">{day}</span>
          {dayRecord && (
            <span className="text-xs absolute bottom-1">
              {moodEmojis[dayRecord.mood_type as keyof typeof moodEmojis]}
            </span>
          )}
        </div>
      )
    }
    
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm px-4 py-4">
        <h1 className="text-lg font-semibold text-gray-800 mb-4">心情历史</h1>
        
        {/* 搜索栏 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索心情记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
        
        {/* 视图切换和筛选 */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Clock size={16} />
              时间轴
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={16} />
              日历
            </button>
          </div>
          
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          >
            <option value="all">全部心情</option>
            <option value="happy">开心</option>
            <option value="sad">难过</option>
            <option value="calm">平静</option>
            <option value="excited">兴奋</option>
          </select>
        </div>
      </header>

      {/* 内容区域 */}
      <div className="p-4">
        {viewMode === 'timeline' ? renderTimelineView() : renderCalendarView()}
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📝</div>
            <p className="text-gray-500">暂无心情记录</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default History