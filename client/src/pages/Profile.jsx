import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Camera, Upload, X, User, Edit3, Save } from 'lucide-react'

export default function Profile() {
  const { user, updateUser, uploadPhoto } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: user?.name || '',
    age: user?.age || '',
    bio: user?.bio || ''
  })
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setUploading(true)
    const result = await uploadPhoto(file)
    
    if (result.success) {
      const updatedUser = {
        ...user,
        photos: [...(user.photos || []), result.photoUrl]
      }
      updateUser(updatedUser)
    } else {
      alert(result.error || 'Upload failed')
    }
    
    setUploading(false)
  }

  const removePhoto = (photoIndex) => {
    const updatedPhotos = user.photos.filter((_, index) => index !== photoIndex)
    const updatedUser = { ...user, photos: updatedPhotos }
    updateUser(updatedUser)
  }

  const handleSaveProfile = () => {
    const updatedUser = {
      ...user,
      name: editData.name,
      age: parseInt(editData.age),
      bio: editData.bio
    }
    updateUser(updatedUser)
    setIsEditing(false)
  }

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="btn-primary flex items-center space-x-2"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photos Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              {user?.photos?.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={`https://work-2-fqgbvgfiamltorll.prod-runtime.all-hands.dev${photo}`}
                    alt={`Profile ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                      Main Photo
                    </div>
                  )}
                </div>
              ))}
              
              {(!user?.photos || user.photos.length < 6) && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-pink-500 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Add Photo</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <p className="text-sm text-gray-500">
              Add up to 6 photos. Your first photo will be your main profile picture.
            </p>
          </div>

          {/* Profile Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{user?.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="age"
                    min="18"
                    max="100"
                    value={editData.age}
                    onChange={handleEditChange}
                    className="input-field"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{user?.age} years old</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <p className="text-gray-900 font-medium">{user?.email}</p>
                <p className="text-sm text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    rows="4"
                    value={editData.bio}
                    onChange={handleEditChange}
                    className="input-field resize-none"
                    placeholder="Tell people about yourself..."
                  />
                ) : (
                  <p className="text-gray-900">{user?.bio || 'No bio added yet.'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <p className="text-gray-900 font-medium">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>

            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleSaveProfile}
                  className="btn-primary"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditData({
                      name: user?.name || '',
                      age: user?.age || '',
                      bio: user?.bio || ''
                    })
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Tips */}
        <div className="mt-8 p-6 bg-gradient-to-r from-pink-50 to-red-50 rounded-lg border border-pink-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Add multiple photos to show different sides of your personality</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Write an engaging bio that tells people what makes you unique</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Use high-quality, recent photos for the best results</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-pink-500">•</span>
              <span>Be authentic and honest in your profile information</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}