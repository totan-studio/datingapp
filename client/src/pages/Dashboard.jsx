import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Search, MessageCircle, Heart, Video, Users, Camera, User } from 'lucide-react'
import axios from 'axios'

export default function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalMatches: 0,
    newMatches: 0,
    unreadMessages: 0
  })
  const [recentMatches, setRecentMatches] = useState([])

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const response = await axios.get('/api/matches')
      setRecentMatches(response.data.slice(0, 3)) // Show only 3 recent matches
      setStats(prev => ({
        ...prev,
        totalMatches: response.data.length,
        newMatches: response.data.filter(match => 
          new Date(match.matchedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length
      }))
    } catch (error) {
      console.error('Error fetching matches:', error)
    }
  }

  const quickActions = [
    {
      title: 'Discover People',
      description: 'Find your perfect match',
      icon: Search,
      link: '/discover',
      color: 'from-pink-500 to-red-500'
    },
    {
      title: 'My Matches',
      description: 'Chat with your matches',
      icon: MessageCircle,
      link: '/matches',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Edit Profile',
      description: 'Update your photos and info',
      icon: Camera,
      link: '/profile',
      color: 'from-blue-500 to-purple-500'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to find your perfect match? Let's get started!
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-pink-100">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.newMatches}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Video className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Video Calls</p>
              <p className="text-2xl font-bold text-gray-900">Available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <Link
                key={index}
                to={action.link}
                className="card p-6 hover:scale-105 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {action.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {action.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Matches */}
      {recentMatches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Matches</h2>
            <Link
              to="/matches"
              className="text-pink-600 hover:text-pink-700 font-medium text-sm"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentMatches.map((match) => (
              <Link
                key={match.id}
                to={`/chat/${match.id}`}
                className="card p-4 hover:scale-105 transition-all duration-300"
              >
                <div className="flex items-center space-x-3">
                  {match.photos?.[0] ? (
                    <img
                      src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${match.photos[0]}`}
                      alt={match.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{match.name}</h3>
                    <p className="text-sm text-gray-600">Age {match.age}</p>
                    {match.isOnline && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Online</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profile Completion */}
      {(!user?.photos || user.photos.length === 0) && (
        <div className="card p-6 bg-gradient-to-r from-pink-50 to-red-50 border-pink-200">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-pink-100">
              <Camera className="h-6 w-6 text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Complete Your Profile
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                Add photos to your profile to get more matches and start video calling!
              </p>
              <Link
                to="/profile"
                className="btn-primary inline-block"
              >
                Add Photos
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}