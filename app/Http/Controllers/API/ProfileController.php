<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    /**
     * Get the authenticated user's profile
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile()->with('user.photos')->first();
        
        return response()->json($profile);
    }

    /**
     * Create or update the authenticated user's profile
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'bio' => 'nullable|string|max:1000',
            'gender' => 'nullable|string|max:50',
            'location' => 'nullable|string|max:255',
            'interests' => 'nullable|array',
            'preferences' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Get or create profile
        $profile = $user->profile;
        if (!$profile) {
            $profile = new Profile(['user_id' => $user->id]);
        }
        
        if ($request->has('bio')) {
            $profile->bio = $request->bio;
        }
        
        if ($request->has('gender')) {
            $profile->gender = $request->gender;
        }
        
        if ($request->has('location')) {
            $profile->location = $request->location;
        }
        
        if ($request->has('interests')) {
            $profile->interests = json_encode($request->interests);
        }
        
        if ($request->has('preferences')) {
            $profile->preferences = json_encode($request->preferences);
        }
        
        $profile->save();
        
        return response()->json($profile);
    }

    /**
     * Update the authenticated user's profile
     */
    public function update(Request $request)
    {
        // Reuse the store method for updates
        return $this->store($request);
    }

    /**
     * Upload a photo for the authenticated user
     */
    public function uploadPhoto(Request $request)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'photo' => 'required|image|max:10240', // 10MB max
            'is_primary' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Count existing photos
        $photoCount = $user->photos()->count();
        
        // Get max photos setting
        $maxPhotos = 6; // Default
        $maxPhotosSetting = \App\Models\AdminSetting::where('setting_key', 'max_photos')->first();
        if ($maxPhotosSetting) {
            $maxPhotos = json_decode($maxPhotosSetting->setting_value);
        }
        
        if ($photoCount >= $maxPhotos) {
            return response()->json([
                'message' => 'Maximum number of photos reached. Please delete some photos before uploading more.'
            ], 400);
        }
        
        // Store the file
        $path = $request->file('photo')->store('photos', 'public');
        
        // Create photo record
        $photo = new Photo([
            'user_id' => $user->id,
            'photo_url' => Storage::url($path),
            'is_primary' => $request->is_primary ?? ($photoCount === 0), // First photo is primary by default
            'order' => $photoCount + 1,
        ]);
        
        $photo->save();
        
        // If this is set as primary, update other photos
        if ($photo->is_primary) {
            $user->photos()->where('id', '!=', $photo->id)->update(['is_primary' => false]);
        }
        
        return response()->json($photo, 201);
    }

    /**
     * Delete a photo
     */
    public function deletePhoto(Photo $photo, Request $request)
    {
        $user = $request->user();
        
        // Check if the photo belongs to the authenticated user
        if ($photo->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // If this is the primary photo and there are other photos, set another one as primary
        if ($photo->is_primary) {
            $nextPhoto = $user->photos()->where('id', '!=', $photo->id)->first();
            if ($nextPhoto) {
                $nextPhoto->is_primary = true;
                $nextPhoto->save();
            }
        }
        
        // Delete the file from storage
        $path = str_replace('/storage/', '', $photo->photo_url);
        Storage::disk('public')->delete($path);
        
        // Delete the photo record
        $photo->delete();
        
        return response()->json(['message' => 'Photo deleted successfully']);
    }

    /**
     * Set a photo as primary
     */
    public function setPrimaryPhoto(Photo $photo, Request $request)
    {
        $user = $request->user();
        
        // Check if the photo belongs to the authenticated user
        if ($photo->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        // Update all user photos to not be primary
        $user->photos()->update(['is_primary' => false]);
        
        // Set this photo as primary
        $photo->is_primary = true;
        $photo->save();
        
        return response()->json($photo);
    }
}
