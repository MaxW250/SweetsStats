export default function IntelligencePage() {
  const services = [
    { name: 'Chaturbate API', icon: '🎥' },
    { name: 'Metricool', icon: '📊' },
    { name: 'Instagram', icon: '📱' },
    { name: 'TikTok', icon: '🎬' },
    { name: 'OpenAI / Claude', icon: '🤖' },
  ]

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">
          Intelligence Hub
        </h1>
        <p className="text-gray-600 mt-2">AI-powered insights coming soon</p>
      </div>

      <div className="bg-gradient-to-br from-coral from-10% to-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">🧠</div>
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
          Welcome to Intelligence
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          This is where your AI agents will live. Get personalized insights, recommendations, and automation
          to help you grow your channel.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Connected Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((service) => (
            <div
              key={service.name}
              className="bg-white rounded-lg border border-gray-200 p-6 opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{service.icon}</div>
                <div>
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
