import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [incomingCall, setIncomingCall] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const newSocket = io('https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev')
      
      newSocket.on('connect', () => {
        console.log('Connected to server')
        newSocket.emit('user-online', user.id)
      })

      newSocket.on('new-match', (data) => {
        // Handle new match notification
        console.log('New match:', data)
        // You could show a notification here
      })

      newSocket.on('incoming-call', (data) => {
        setIncomingCall(data)
      })

      newSocket.on('call-ended', () => {
        setIncomingCall(null)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  const joinChat = (chatId) => {
    if (socket) {
      socket.emit('join-chat', chatId)
    }
  }

  const sendMessage = (chatId, message) => {
    if (socket) {
      socket.emit('send-message', {
        chatId,
        message,
        senderId: user.id
      })
    }
  }

  const getMessages = (chatId) => {
    if (socket) {
      socket.emit('get-messages', chatId)
    }
  }

  const callUser = (targetUserId, offer) => {
    if (socket) {
      socket.emit('call-user', {
        targetUserId,
        offer,
        callerId: user.id
      })
    }
  }

  const answerCall = (callerId, answer) => {
    if (socket) {
      socket.emit('answer-call', {
        callerId,
        answer
      })
    }
  }

  const sendIceCandidate = (targetUserId, candidate) => {
    if (socket) {
      socket.emit('ice-candidate', {
        targetUserId,
        candidate
      })
    }
  }

  const endCall = (targetUserId) => {
    if (socket) {
      socket.emit('end-call', { targetUserId })
    }
  }

  const value = {
    socket,
    onlineUsers,
    incomingCall,
    setIncomingCall,
    joinChat,
    sendMessage,
    getMessages,
    callUser,
    answerCall,
    sendIceCandidate,
    endCall
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}