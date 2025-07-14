import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  User,
  MessageCircle,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import AgoraRTC from 'agora-rtc-sdk-ng'

export default function AgoraVideoCall() {
  const { userId: callUserId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket } = useSocket()
  
  const [callUser, setCallUser] = useState(null)
  const [callState, setCallState] = useState('idle') // idle, calling, connected, ended, error
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState('')
  const [agoraConfig, setAgoraConfig] = useState(null)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const callStartTimeRef = useRef(null)
  const clientRef = useRef(null)
  const localTracksRef = useRef([])
  const remoteUsersRef = useRef({})

  const channelName = `call_${[user?.id, callUserId].sort().join('_')}`

  useEffect(() => {
    fetchCallUser()
    initializeAgora()
    
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    let interval
    if (callState === 'connected' && callStartTimeRef.current) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  useEffect(() => {
    if (socket) {
      socket.on('agora-call-request', handleIncomingCall)
      socket.on('agora-call-accepted', handleCallAccepted)
      socket.on('agora-call-rejected', handleCallRejected)
      socket.on('agora-call-ended', handleCallEnded)

      return () => {
        socket.off('agora-call-request')
        socket.off('agora-call-accepted')
        socket.off('agora-call-rejected')
        socket.off('agora-call-ended')
      }
    }
  }, [socket])

  const fetchCallUser = async () => {
    try {
      const response = await axios.get('/api/matches')
      const match = response.data.find(m => m.id === callUserId)
      setCallUser(match)
    } catch (error) {
      console.error('Error fetching call user:', error)
      setError('Failed to load user information')
    }
  }

  const initializeAgora = async () => {
    try {
      console.log('Initializing Agora with channel:', channelName, 'user:', user?.id)
      
      // Get Agora token from backend
      const response = await axios.post('/api/agora/token', {
        channelName,
        uid: user?.id
      })
      
      console.log('Agora token response:', response.data)
      setAgoraConfig(response.data)
      
      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      // Set up event handlers
      client.on('user-published', handleUserPublished)
      client.on('user-unpublished', handleUserUnpublished)
      client.on('user-left', handleUserLeft)

      console.log('Agora initialized successfully')

    } catch (error) {
      console.error('Error initializing Agora:', error)
      console.error('Error details:', error.response?.data)
      setError(error.response?.data?.error || 'Failed to initialize video calling. Please contact admin.')
      setCallState('error')
    }
  }

  const handleUserPublished = async (user, mediaType) => {
    await clientRef.current.subscribe(user, mediaType)
    
    if (mediaType === 'video') {
      const remoteVideoTrack = user.videoTrack
      if (remoteVideoRef.current) {
        remoteVideoTrack.play(remoteVideoRef.current)
      }
    }
    
    if (mediaType === 'audio') {
      const remoteAudioTrack = user.audioTrack
      remoteAudioTrack.play()
    }

    remoteUsersRef.current[user.uid] = user
    
    if (callState === 'calling') {
      setCallState('connected')
      callStartTimeRef.current = Date.now()
    }
  }

  const handleUserUnpublished = (user, mediaType) => {
    if (mediaType === 'video' && remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = ''
    }
  }

  const handleUserLeft = (user) => {
    delete remoteUsersRef.current[user.uid]
    if (remoteVideoRef.current) {
      remoteVideoRef.current.innerHTML = ''
    }
    handleCallEnded()
  }

  const startCall = async () => {
    console.log('startCall clicked, agoraConfig:', agoraConfig)
    
    if (!agoraConfig) {
      console.log('No agora config, setting error')
      setError('Video calling not configured')
      return
    }

    try {
      console.log('Starting call...')
      setCallState('calling')
      
      // Join channel
      console.log('Joining channel:', channelName, 'with appId:', agoraConfig.appId)
      await clientRef.current.join(
        agoraConfig.appId,
        channelName,
        agoraConfig.token,
        user?.id
      )

      console.log('Creating tracks...')
      // Create and publish local tracks
      const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
      localTracksRef.current = [audioTrack, videoTrack]

      // Play local video
      if (localVideoRef.current) {
        console.log('Playing local video')
        videoTrack.play(localVideoRef.current)
      }

      console.log('Publishing tracks...')
      // Publish tracks
      await clientRef.current.publish([audioTrack, videoTrack])

      // Notify other user via socket
      if (socket) {
        console.log('Emitting call request via socket')
        socket.emit('agora-call-request', {
          targetUserId: callUserId,
          callerId: user?.id,
          callerName: user?.name,
          channelName
        })
      }

      console.log('Call started successfully')

    } catch (error) {
      console.error('Error starting call:', error)
      setError('Failed to start call')
      setCallState('idle')
    }
  }

  const handleIncomingCall = async (data) => {
    if (data.callerId === callUserId) {
      try {
        setCallState('connecting')
        
        // Join channel
        await clientRef.current.join(
          agoraConfig.appId,
          data.channelName,
          agoraConfig.token,
          user?.id
        )

        // Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks()
        localTracksRef.current = [audioTrack, videoTrack]

        // Play local video
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current)
        }

        // Publish tracks
        await clientRef.current.publish([audioTrack, videoTrack])

        // Notify caller that call was accepted
        if (socket) {
          socket.emit('agora-call-accepted', {
            callerId: data.callerId,
            accepterId: user?.id
          })
        }

        setCallState('connected')
        callStartTimeRef.current = Date.now()

      } catch (error) {
        console.error('Error accepting call:', error)
        setError('Failed to accept call')
      }
    }
  }

  const handleCallAccepted = () => {
    // Call was accepted, wait for remote user to join
  }

  const handleCallRejected = () => {
    setCallState('ended')
    cleanup()
    setTimeout(() => {
      navigate(`/chat/${callUserId}`)
    }, 2000)
  }

  const handleCallEnded = () => {
    setCallState('ended')
    cleanup()
    setTimeout(() => {
      navigate(`/chat/${callUserId}`)
    }, 2000)
  }

  const endCall = () => {
    if (socket) {
      socket.emit('agora-call-ended', { targetUserId: callUserId })
    }
    handleCallEnded()
  }

  const toggleVideo = async () => {
    if (localTracksRef.current[1]) {
      await localTracksRef.current[1].setEnabled(!isVideoEnabled)
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const toggleAudio = async () => {
    if (localTracksRef.current[0]) {
      await localTracksRef.current[0].setEnabled(!isAudioEnabled)
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const cleanup = async () => {
    try {
      // Stop local tracks
      localTracksRef.current.forEach(track => {
        track.stop()
        track.close()
      })
      localTracksRef.current = []

      // Leave channel
      if (clientRef.current) {
        await clientRef.current.leave()
      }

      // Clear video containers
      if (localVideoRef.current) {
        localVideoRef.current.innerHTML = ''
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.innerHTML = ''
      }

    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!callUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (callState === 'error') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Video Call Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(`/chat/${callUserId}`)}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white py-3 px-6 rounded-lg font-medium hover:from-pink-600 hover:to-red-600"
          >
            Back to Chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-50 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {callUser.photos?.[0] ? (
            <img
              src={`https://work-2-eypmeeyoeujzmcvs.prod-runtime.all-hands.dev${callUser.photos[0]}`}
              alt={callUser.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              <User className="h-5 w-5" />
            </div>
          )}
          <div>
            <h2 className="font-semibold">{callUser.name}</h2>
            <p className="text-sm opacity-75">
              {callState === 'calling' && 'Calling...'}
              {callState === 'connecting' && 'Connecting...'}
              {callState === 'connected' && formatDuration(callDuration)}
              {callState === 'ended' && 'Call ended'}
              {callState === 'idle' && 'Ready to call'}
            </p>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote video */}
        <div
          ref={remoteVideoRef}
          className="w-full h-full bg-gray-900"
        />
        
        {/* Local video */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
          <div
            ref={localVideoRef}
            className="w-full h-full"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="h-6 w-6 text-white" />
            </div>
          )}
        </div>

        {/* Call state overlay */}
        {callState !== 'connected' && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              {callState === 'idle' && (
                <div>
                  <div className="text-6xl mb-4">📹</div>
                  <h3 className="text-xl font-semibold mb-2">Ready to video call?</h3>
                  <p className="text-gray-300 mb-6">
                    Start a video call with {callUser.name}
                  </p>
                </div>
              )}
              
              {callState === 'calling' && (
                <div>
                  <div className="animate-pulse text-6xl mb-4">📞</div>
                  <h3 className="text-xl font-semibold mb-2">Calling {callUser.name}...</h3>
                  <p className="text-gray-300">Waiting for them to answer</p>
                </div>
              )}
              
              {callState === 'connecting' && (
                <div>
                  <div className="animate-bounce text-6xl mb-4">📞</div>
                  <h3 className="text-xl font-semibold mb-2">Connecting...</h3>
                  <p className="text-gray-300">Setting up the call</p>
                </div>
              )}
              
              {callState === 'ended' && (
                <div>
                  <div className="text-6xl mb-4">👋</div>
                  <h3 className="text-xl font-semibold mb-2">Call ended</h3>
                  <p className="text-gray-300">Redirecting to chat...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-50 p-6">
        <div className="flex justify-center space-x-6">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="h-6 w-6 text-white" />
            ) : (
              <MicOff className="h-6 w-6 text-white" />
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled 
                ? 'bg-gray-600 hover:bg-gray-700' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="h-6 w-6 text-white" />
            ) : (
              <VideoOff className="h-6 w-6 text-white" />
            )}
          </button>

          {callState === 'idle' ? (
            <button
              onClick={startCall}
              disabled={!agoraConfig}
              className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Phone className="h-6 w-6 text-white" />
            </button>
          ) : (
            <button
              onClick={endCall}
              className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
            >
              <PhoneOff className="h-6 w-6 text-white" />
            </button>
          )}

          <button
            onClick={() => navigate(`/chat/${callUserId}`)}
            className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}