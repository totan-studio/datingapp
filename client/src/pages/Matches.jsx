import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Video, Heart, User } from 'lucide-react'
import axios from 'axios'

export default function Matches() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/matches')
      setMatches(response.data)
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <Heart className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No matches yet
          </h2>
          <p className="text-gray-600 mb-6">
            Start swiping to find your perfect match! When someone likes you back, they'll appear here.
          </p>
          <Link to="/discover" className="btn-primary">
            Start Discovering
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Matches</h1>
        <p className="text-gray-600">
          {matches.length} {matches.length === 1 ? 'person likes' : 'people like'} you back!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <div key={match.id} className="card overflow-hidden hover:scale-105 transition-all duration-300">
            <div className="relative">
              {match.photos?.[0] ? (
                <img
                  src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${match.photos[0]}`}
                  alt={match.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-pink-200 to-red-200 flex items-center justify-center">
                  <User className="h-16 w-16 text-white" />
                </div>
              )}
              
              {/* Online indicator */}
              {match.isOnline && (
                <div className="absolute top-4 right-4 flex items-center space-x-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span>Online</span>
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{match.name}</h3>
                  <p className="text-gray-600">Age {match.age}</p>
                </div>
                <Heart className="h-6 w-6 text-pink-500" />
              </div>

              {match.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {match.bio}
                </p>
              )}

              <div className="flex space-x-3">
                <Link
                  to={`/chat/${match.id}`}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 text-white py-2 px-4 rounded-lg font-medium text-center hover:from-pink-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </Link>
                
                {match.isOnline && (
                  <Link
                    to={`/video-call/${match.id}`}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
                  >
                    <Video className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips section */}
      <div className="mt-12 card p-6 bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💡 Tips for Great Conversations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="space-y-2">
            <p className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Ask open-ended questions to keep the conversation flowing</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Share something interesting about yourself</span>
            </p>
          </div>
          <div className="space-y-2">
            <p className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Be genuine and authentic in your messages</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Suggest a video call when you feel comfortable</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}