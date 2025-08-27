import { X, Shield, Eye, Database, Share2, UserCheck, Clock, Mail } from 'lucide-react'

interface PrivacyPolicyModalProps {
  isOpen: boolean
  onClose: () => void
}

const PrivacyPolicyModal = ({ isOpen, onClose }: PrivacyPolicyModalProps) => {
  if (!isOpen) return null

  const sections = [
    {
      icon: Eye,
      title: '信息收集',
      content: [
        '我们收集您主动提供的信息，包括：',
        '• 注册信息：邮箱地址、用户名',
        '• 个人资料：头像、姓名、生日、性别、个人简介',
        '• 心情记录：您的心情状态、文字记录、图片（如有）',
        '• 使用数据：应用使用统计、偏好设置'
      ]
    },
    {
      icon: Database,
      title: '信息使用',
      content: [
        '我们使用收集的信息用于：',
        '• 提供心情记录和管理服务',
        '• 个性化您的使用体验',
        '• 改进应用功能和性能',
        '• 发送重要通知和更新',
        '• 确保账户安全和数据完整性'
      ]
    },
    {
      icon: Shield,
      title: '信息保护',
      content: [
        '我们采取多重措施保护您的信息：',
        '• 数据加密：传输和存储过程中的端到端加密',
        '• 访问控制：严格的权限管理和身份验证',
        '• 安全存储：使用可靠的云服务提供商（Supabase）',
        '• 定期备份：确保数据不会意外丢失',
        '• 安全审计：定期检查和更新安全措施'
      ]
    },
    {
      icon: Share2,
      title: '信息分享',
      content: [
        '我们承诺：',
        '• 不会出售您的个人信息',
        '• 不会与第三方分享您的心情记录',
        '• 仅在法律要求或保护用户安全时披露信息',
        '• 匿名统计数据可能用于改进服务',
        '• 任何数据分享都会事先征得您的同意'
      ]
    },
    {
      icon: UserCheck,
      title: '您的权利',
      content: [
        '您拥有以下权利：',
        '• 访问权：查看我们收集的您的个人信息',
        '• 修改权：更新或修正您的个人信息',
        '• 删除权：要求删除您的账户和所有数据',
        '• 导出权：获取您的数据副本',
        '• 撤回同意：随时撤回对数据处理的同意'
      ]
    },
    {
      icon: Clock,
      title: '数据保留',
      content: [
        '数据保留政策：',
        '• 账户数据：在账户活跃期间保留',
        '• 心情记录：永久保留，直到您主动删除',
        '• 日志数据：保留30天用于故障排查',
        '• 已删除数据：30天内可恢复，之后永久删除',
        '• 非活跃账户：2年后可能被删除'
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-800">隐私政策</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 引言 */}
          <div className="mb-8">
            <p className="text-gray-600 leading-relaxed">
              欢迎使用心情日记应用。我们深知隐私对您的重要性，本隐私政策详细说明了我们如何收集、使用、保护和分享您的个人信息。使用我们的服务即表示您同意本政策的条款。
            </p>
            <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800">
                <strong>最后更新：</strong> {new Date().toLocaleDateString('zh-CN')}
              </p>
            </div>
          </div>

          {/* 政策条款 */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index} className="">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <section.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {section.title}
                  </h3>
                </div>
                <div className="ml-11 space-y-2">
                  {section.content.map((item, itemIndex) => (
                    <p key={itemIndex} className="text-gray-600 leading-relaxed">
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 联系信息 */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">联系我们</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              如果您对本隐私政策有任何疑问或需要行使您的权利，请通过以下方式联系我们：
            </p>
            <div className="mt-3 space-y-1">
              <p className="text-sm text-gray-600">• 邮箱：privacy@mooddiary.app</p>
              <p className="text-sm text-gray-600">• 我们将在收到您的请求后7个工作日内回复</p>
            </div>
          </div>

          {/* 政策变更 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">政策变更通知</h4>
            <p className="text-sm text-blue-700">
              我们可能会不时更新本隐私政策。重大变更将通过应用内通知或邮件方式告知您。继续使用我们的服务即表示您接受更新后的政策。
            </p>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            我已阅读并理解
          </button>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyModal