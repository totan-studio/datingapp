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
  MessageCircle
} from 'lucide-react'
import axios from 'axios'

export default function VideoCall() {
  const { userId: callUserId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, callUser: callUserSocket, answerCall, sendIceCandidate, endCall, incomingCall, setIncomingCall } = useSocket()
  
  const [callUser, setCallUser] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [peerConnection, setPeerConnection] = useState(null)
  const [callState, setCallState] = useState('idle') // idle, calling, connected, ended
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [callDuration, setCallDuration] = useState(0)
  
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const callStartTimeRef = useRef(null)

  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  useEffect(() => {
    fetchCallUser()
    initializeMedia()
    
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('incoming-call', handleIncomingCall)
      socket.on('call-answered', handleCallAnswered)
      socket.on('ice-candidate', handleIceCandidate)
      socket.on('call-ended', handleCallEnded)

      return () => {
        socket.off('incoming-call')
        socket.off('call-answered')
        socket.off('ice-candidate')
        socket.off('call-ended')
      }
    }
  }, [socket, peerConnection])

  useEffect(() => {
    let interval
    if (callState === 'connected' && callStartTimeRef.current) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [callState])

  const fetchCallUser = async () => {
    try {
      const response = await axios.get('/api/matches')
      const match = response.data.find(m => m.id === callUserId)
      setCallUser(match)
    } catch (error) {
      console.error('Error fetching call user:', error)
    }
  }

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setLocalStream(stream)
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accessing media devices:', error)
      alert('Unable to access camera and microphone. Please check permissions.')
    }
  }

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(iceServers)
    
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        sendIceCandidate(callUserId, event.candidate)
      }
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('connected')
        callStartTimeRef.current = Date.now()
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        handleCallEnded()
      }
    }

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream)
      })
    }

    setPeerConnection(pc)
    return pc
  }

  const startCall = async () => {
    if (!socket || !localStream) return

    setCallState('calling')
    const pc = createPeerConnection()
    
    try {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      callUserSocket(callUserId, offer)
    } catch (error) {
      console.error('Error creating offer:', error)
      setCallState('idle')
    }
  }

  const handleIncomingCall = async (data) => {
    if (data.callerId === callUserId) {
      setCallState('incoming')
      const pc = createPeerConnection()
      
      try {
        await pc.setRemoteDescription(data.offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        answerCall(data.callerId, answer)
        setCallState('connected')
        callStartTimeRef.current = Date.now()
      } catch (error) {
        console.error('Error answering call:', error)
      }
    }
  }

  const handleCallAnswered = async (data) => {
    if (peerConnection) {
      try {
        await peerConnection.setRemoteDescription(data.answer)
        setCallState('connected')
        callStartTimeRef.current = Date.now()
      } catch (error) {
        console.error('Error handling answer:', error)
      }
    }
  }

  const handleIceCandidate = async (data) => {
    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(data.candidate)
      } catch (error) {
        console.error('Error adding ice candidate:', error)
      }
    }
  }

  const handleCallEnded = () => {
    setCallState('ended')
    cleanup()
    setTimeout(() => {
      navigate(`/chat/${callUserId}`)
    }, 2000)
  }

  const endCallHandler = () => {
    if (socket) {
      endCall(callUserId)
    }
    handleCallEnded()
  }

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    if (peerConnection) {
      peerConnection.close()
    }
    setLocalStream(null)
    setRemoteStream(null)
    setPeerConnection(null)
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

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-50 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {callUser.photos?.[0] ? (
            <img
              src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${callUser.photos[0]}`}
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
              {callState === 'incoming' && 'Incoming call...'}
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
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local video */}
        <div className="absolute top-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
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
              
              {callState === 'incoming' && (
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
              className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
            >
              <Phone className="h-6 w-6 text-white" />
            </button>
          ) : (
            <button
              onClick={endCallHandler}
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

      {/* Incoming call modal */}
      {incomingCall && incomingCall.callerId === callUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            <div className="text-6xl mb-4">📞</div>
            <h3 className="text-xl font-semibold mb-2">
              Incoming call from {incomingCall.callerName}
            </h3>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setIncomingCall(null)
                  navigate(`/chat/${callUserId}`)
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium"
              >
                Decline
              </button>
              <button
                onClick={() => {
                  setIncomingCall(null)
                  // The call will be handled by the socket event
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}