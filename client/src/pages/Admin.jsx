import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import axios from 'axios'

export default function Admin() {
  const { user } = useAuth()
  const [agoraSettings, setAgoraSettings] = useState({
    appId: '',
    appCertificate: '',
    tokenExpirationTime: 3600
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showCertificate, setShowCertificate] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    fetchAgoraSettings()
  }, [])

  const fetchAgoraSettings = async () => {
    try {
      const response = await axios.get('/api/admin/agora-settings')
      if (response.data.configured) {
        setAgoraSettings(prev => ({
          ...prev,
          appId: response.data.appId,
          tokenExpirationTime: response.data.tokenExpirationTime
        }))
        setIsConfigured(true)
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setMessage({ type: 'error', text: 'Admin access required' })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      await axios.post('/api/admin/agora-settings', agoraSettings)
      setMessage({ type: 'success', text: 'Agora settings updated successfully!' })
      setIsConfigured(true)
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update settings' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAgoraSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Check if user is admin
  if (!user || user.email !== 'admin@loveconnect.com') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You need admin privileges to access this page.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-red-500 px-8 py-6">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-white" />
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-pink-100">Manage Agora video calling settings</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Status Banner */}
            <div className={`rounded-lg p-4 mb-6 ${
              isConfigured 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                {isConfigured ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span className={`font-medium ${
                  isConfigured ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {isConfigured 
                    ? 'Agora is configured and ready for video calls' 
                    : 'Agora needs to be configured for video calling to work'
                  }
                </span>
              </div>
            </div>

            {/* Message */}
            {message.text && (
              <div className={`rounded-lg p-4 mb-6 ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Agora Settings Form */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Agora Video Calling Configuration
              </h2>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">How to get Agora credentials:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Go to <a href="https://console.agora.io" target="_blank" rel="noopener noreferrer" className="underline">Agora Console</a></li>
                  <li>2. Create a new project or select existing one</li>
                  <li>3. Copy the App ID from your project</li>
                  <li>4. Generate an App Certificate in project settings</li>
                  <li>5. Paste both values below</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="appId" className="block text-sm font-medium text-gray-700 mb-2">
                    Agora App ID *
                  </label>
                  <input
                    type="text"
                    id="appId"
                    name="appId"
                    value={agoraSettings.appId}
                    onChange={handleInputChange}
                    placeholder="Enter your Agora App ID"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="appCertificate" className="block text-sm font-medium text-gray-700 mb-2">
                    Agora App Certificate *
                  </label>
                  <div className="relative">
                    <input
                      type={showCertificate ? "text" : "password"}
                      id="appCertificate"
                      name="appCertificate"
                      value={agoraSettings.appCertificate}
                      onChange={handleInputChange}
                      placeholder="Enter your Agora App Certificate"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCertificate(!showCertificate)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showCertificate ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="tokenExpirationTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Token Expiration Time (seconds)
                  </label>
                  <select
                    id="tokenExpirationTime"
                    name="tokenExpirationTime"
                    value={agoraSettings.tokenExpirationTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value={1800}>30 minutes</option>
                    <option value={3600}>1 hour</option>
                    <option value={7200}>2 hours</option>
                    <option value={14400}>4 hours</option>
                    <option value={28800}>8 hours</option>
                    <option value={86400}>24 hours</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Additional Info */}
            <div className="mt-8 bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Important Notes</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• App Certificate is stored securely and never displayed after saving</li>
                <li>• Tokens are generated dynamically for each video call</li>
                <li>• Users will see an error if Agora is not configured</li>
                <li>• Changes take effect immediately for new video calls</li>
                <li>• For production, implement proper token generation server</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}