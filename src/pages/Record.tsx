import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useMoodStore } from '../store'
import { toast } from 'sonner'

const Record = () => {
  const navigate = useNavigate()
  const { createRecord, tags, fetchTags } = useMoodStore()
  const [selectedMood, setSelectedMood] = useState('')
  const [intensity, setIntensity] = useState(3)
  const [note, setNote] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTags()
  }, [fetchTags])

  const moods = [
    { type: 'happy', emoji: '😊', label: '开心', color: 'bg-yellow-100 text-yellow-600' },
    { type: 'sad', emoji: '😢', label: '难过', color: 'bg-blue-100 text-blue-600' },
    { type: 'angry', emoji: '😠', label: '愤怒', color: 'bg-red-100 text-red-600' },
    { type: 'anxious', emoji: '😰', label: '焦虑', color: 'bg-purple-100 text-purple-600' },
    { type: 'calm', emoji: '😌', label: '平静', color: 'bg-green-100 text-green-600' },
    { type: 'excited', emoji: '🤩', label: '兴奋', color: 'bg-orange-100 text-orange-600' },
    { type: 'tired', emoji: '😴', label: '疲惫', color: 'bg-gray-100 text-gray-600' },
    { type: 'confused', emoji: '😕', label: '困惑', color: 'bg-indigo-100 text-indigo-600' }
  ]

  // 使用从数据库获取的标签，如果没有则使用默认标签
  const availableTags = tags.length > 0 ? tags : [
    { id: '1', tag_name: '工作', color: '#FF6B35', user_id: '', created_at: '' },
    { id: '2', tag_name: '生活', color: '#4A90E2', user_id: '', created_at: '' },
    { id: '3', tag_name: '运动', color: '#7ED321', user_id: '', created_at: '' },
    { id: '4', tag_name: '学习', color: '#9013FE', user_id: '', created_at: '' },
    { id: '5', tag_name: '社交', color: '#FF9500', user_id: '', created_at: '' }
  ]

  const handleSave = async () => {
    if (!selectedMood) {
      toast.error('请选择心情类型')
      return
    }

    console.log('开始保存心情记录...', {
      selectedMood,
      intensity,
      note: note.trim(),
      selectedTags
    })

    setLoading(true)
    try {
      console.log('调用createRecord函数...')
      
      // 获取选中标签的ID
      const selectedTagIds = selectedTags.map(tagName => {
        const tag = availableTags.find(t => t.tag_name === tagName)
        return tag?.id
      }).filter(Boolean) as string[]
      
      console.log('选中的标签ID:', selectedTagIds)
      
      await createRecord({
        mood_type: selectedMood as any,
        intensity,
        note: note.trim() || undefined
      }, selectedTagIds)
      
      console.log('心情记录保存成功！')
      
      // 显示成功提示
      toast.success('心情记录保存成功！', {
        description: '您的心情已经记录下来了',
        duration: 2000
      })
      
      // 延迟导航，让用户看到成功提示
      setTimeout(() => {
        navigate('/')
      }, 1000)
    } catch (error: any) {
      console.error('Save record error:', error)
      console.error('Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      })
      
      // 显示错误提示
      toast.error('保存失败', {
        description: error?.message || '未知错误，请重试',
        duration: 3000
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">记录心情</h1>
          <button
            onClick={handleSave}
            disabled={loading || !selectedMood}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              loading || !selectedMood
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save size={16} />
                保存
              </>
            )}
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* 心情选择 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">选择心情</h2>
          <div className="grid grid-cols-4 gap-3">
            {moods.map((mood) => (
              <button
                key={mood.type}
                onClick={() => setSelectedMood(mood.type)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedMood === mood.type
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{mood.emoji}</div>
                <div className="text-xs font-medium text-gray-600">{mood.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 强度选择 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">情绪强度</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">轻微</span>
            <span className="text-sm text-gray-500">强烈</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="1"
              max="5"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            {/* 刻度标识 */}
            <div className="flex justify-between mt-2 px-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <div
                  key={value}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setIntensity(value)}
                >
                  <div className={`w-2 h-2 rounded-full mb-1 transition-colors ${
                    intensity === value ? 'bg-orange-500' : 'bg-gray-300'
                  }`} />
                  <span className={`text-xs transition-colors ${
                    intensity === value ? 'text-orange-500 font-semibold' : 'text-gray-400'
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center mt-3">
            <span className="text-lg font-semibold text-orange-500">{intensity}</span>
            <span className="text-sm text-gray-500 ml-2">
              {intensity === 1 && '非常轻微'}
              {intensity === 2 && '轻微'}
              {intensity === 3 && '中等'}
              {intensity === 4 && '强烈'}
              {intensity === 5 && '非常强烈'}
            </span>
          </div>
        </div>

        {/* 标签选择 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">添加标签</h2>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.tag_name)
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTags(selectedTags.filter(t => t !== tag.tag_name))
                    } else {
                      setSelectedTags([...selectedTags, tag.tag_name])
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={isSelected ? {} : { backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.tag_name}
                </button>
              )
            })}
          </div>
        </div>

        {/* 文字记录 */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">心情描述</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记录下此刻的感受..."
            className="w-full h-32 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
          />
        </div>
      </div>
    </div>
  )
}

export default Record