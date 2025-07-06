import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { Send, Video, ArrowLeft, User, Phone } from 'lucide-react'
import axios from 'axios'

export default function Chat() {
  const { userId: chatUserId } = useParams()
  const { user } = useAuth()
  const { socket, joinChat, sendMessage, getMessages } = useSocket()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [chatUser, setChatUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  const chatId = [user.id, chatUserId].sort().join('-')

  useEffect(() => {
    fetchChatUser()
    if (socket) {
      joinChat(chatId)
      getMessages(chatId)

      socket.on('new-message', (message) => {
        setMessages(prev => [...prev, message])
      })

      socket.on('chat-messages', (chatMessages) => {
        setMessages(chatMessages)
        setLoading(false)
      })

      return () => {
        socket.off('new-message')
        socket.off('chat-messages')
      }
    }
  }, [socket, chatId, chatUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChatUser = async () => {
    try {
      const response = await axios.get('/api/matches')
      const match = response.data.find(m => m.id === chatUserId)
      setChatUser(match)
    } catch (error) {
      console.error('Error fetching chat user:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim() && socket) {
      sendMessage(chatId, newMessage.trim())
      setNewMessage('')
    }
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const groupMessagesByDate = (messages) => {
    const groups = {}
    messages.forEach(message => {
      const date = formatDate(message.timestamp)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!chatUser) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            User not found
          </h2>
          <p className="text-gray-600 mb-6">
            This user might not be in your matches anymore.
          </p>
          <Link to="/matches" className="btn-primary">
            Back to Matches
          </Link>
        </div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link
              to="/matches"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            
            <div className="flex items-center space-x-3">
              {chatUser.photos?.[0] ? (
                <img
                  src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${chatUser.photos[0]}`}
                  alt={chatUser.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
              
              <div>
                <h2 className="font-semibold text-gray-900">{chatUser.name}</h2>
                {chatUser.isOnline ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Offline</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {chatUser.isOnline && (
              <Link
                to={`/video-call/${chatUser.id}`}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
              >
                <Video className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex justify-center my-4">
              <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {date}
              </span>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${
                  message.senderId === user.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.senderId === user.id
                      ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white'
                      : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === user.id
                        ? 'text-pink-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">👋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Say hello to {chatUser.name}!
            </h3>
            <p className="text-gray-600">
              Start the conversation and get to know each other.
            </p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${chatUser.name}...`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="p-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:from-pink-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}