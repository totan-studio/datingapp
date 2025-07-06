import React, { useState, useEffect } from 'react'
import { useSpring, animated } from 'react-spring'
import { useDrag } from 'react-use-gesture'
import { Heart, X, MapPin, Briefcase, GraduationCap } from 'lucide-react'
import axios from 'axios'

const SwipeCard = ({ user, onSwipe, style }) => {
  const [{ x, y, rot, scale }, set] = useSpring(() => ({
    x: 0,
    y: 0,
    rot: 0,
    scale: 1,
    config: { mass: 1, tension: 500, friction: 40 }
  }))

  const bind = useDrag(({ args: [index], down, movement: [mx, my], direction: [xDir], velocity }) => {
    const trigger = velocity > 0.2
    const dir = xDir < 0 ? -1 : 1
    
    if (!down && trigger) {
      onSwipe(dir > 0 ? 'like' : 'pass')
    }
    
    set({
      x: down ? mx : trigger ? (200 + window.innerWidth) * dir : 0,
      y: down ? my : 0,
      rot: down ? mx / 100 + (my / 100) : 0,
      scale: down ? 1.1 : 1
    })
  })

  return (
    <animated.div
      {...bind()}
      style={{
        ...style,
        transform: x.to(x => `translate3d(${x}px, ${y.get()}px, 0) rotate(${rot.get()}deg) scale(${scale.get()})`)
      }}
      className="swipe-card card overflow-hidden shadow-xl"
    >
      <div className="relative h-full">
        {user.photos?.[0] ? (
          <img
            src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${user.photos[0]}`}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-red-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-bold text-gray-400">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-white font-semibold">No photo available</p>
            </div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* User info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="flex items-center space-x-2 mb-2">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <span className="text-xl">{user.age}</span>
          </div>
          
          {user.bio && (
            <p className="text-sm opacity-90 mb-3 line-clamp-2">{user.bio}</p>
          )}
          
          <div className="flex items-center space-x-4 text-sm opacity-80">
            {user.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{user.location}</span>
              </div>
            )}
            {user.occupation && (
              <div className="flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>{user.occupation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Swipe indicators */}
        <animated.div
          style={{
            opacity: x.to(x => (x > 50 ? (x - 50) / 50 : 0))
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-8 py-4 rounded-full font-bold text-xl rotate-12"
        >
          LIKE
        </animated.div>
        
        <animated.div
          style={{
            opacity: x.to(x => (x < -50 ? (-x - 50) / 50 : 0))
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white px-8 py-4 rounded-full font-bold text-xl -rotate-12"
        >
          PASS
        </animated.div>
      </div>
    </animated.div>
  )
}

export default function Discover() {
  const [users, setUsers] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchModal, setMatchModal] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/discover')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwipe = async (action) => {
    if (currentIndex >= users.length) return

    const currentUser = users[currentIndex]
    
    try {
      const response = await axios.post('/api/swipe', {
        targetUserId: currentUser.id,
        action
      })

      if (response.data.match) {
        setMatchModal(currentUser)
      }

      setCurrentIndex(prev => prev + 1)
    } catch (error) {
      console.error('Error swiping:', error)
    }
  }

  const handleButtonSwipe = (action) => {
    handleSwipe(action)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (users.length === 0 || currentIndex >= users.length) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="card p-8">
          <Heart className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No more profiles to show
          </h2>
          <p className="text-gray-600 mb-6">
            You've seen all available profiles. Check back later for new people to discover!
          </p>
          <button
            onClick={() => {
              setCurrentIndex(0)
              fetchUsers()
            }}
            className="btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="relative h-[600px] mb-8">
        {users.slice(currentIndex, currentIndex + 2).map((user, index) => (
          <SwipeCard
            key={user.id}
            user={user}
            onSwipe={index === 0 ? handleSwipe : () => {}}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: users.length - index
            }}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex justify-center space-x-6">
        <button
          onClick={() => handleButtonSwipe('pass')}
          className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-gray-200"
        >
          <X className="h-8 w-8 text-red-500" />
        </button>
        
        <button
          onClick={() => handleButtonSwipe('like')}
          className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Heart className="h-8 w-8 text-white" />
        </button>
      </div>

      {/* Instructions */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Swipe right to like, left to pass, or use the buttons below
        </p>
      </div>

      {/* Match Modal */}
      {matchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-sm w-full text-center animate-bounce-in">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold gradient-text mb-4">
              It's a Match!
            </h2>
            <div className="flex justify-center mb-4">
              {matchModal.photos?.[0] && (
                <img
                  src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${matchModal.photos[0]}`}
                  alt={matchModal.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              )}
            </div>
            <p className="text-gray-600 mb-6">
              You and {matchModal.name} liked each other!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setMatchModal(null)
                  // Navigate to chat
                  window.location.href = `/chat/${matchModal.id}`
                }}
                className="btn-primary w-full"
              >
                Send Message
              </button>
              <button
                onClick={() => setMatchModal(null)}
                className="btn-secondary w-full"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}