<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    /**
     * Get all matches for the authenticated user
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        // Get mutual matches (both users liked each other)
        $matches = UserMatch::where(function($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->where('action', 'like');
            })
            ->whereExists(function($query) use ($user) {
                $query->select(DB::raw(1))
                      ->from('user_matches')
                      ->whereColumn('user_matches.user_id', 'user_matches.target_user_id')
                      ->whereColumn('user_matches.target_user_id', 'user_matches.user_id')
                      ->where('action', 'like');
            })
            ->with(['targetUser' => function($query) {
                $query->with(['profile', 'primaryPhoto']);
            }])
            ->get();
        
        return response()->json($matches);
    }

    /**
     * Get potential matches for the authenticated user
     */
    public function getPotentialMatches(Request $request)
    {
        $user = $request->user();
        $profile = $user->profile;
        
        // Default preferences if not set
        $preferences = [
            'gender' => null,
            'age_min' => 18,
            'age_max' => 100
        ];
        
        // Get user preferences if available
        if ($profile && $profile->preferences) {
            $userPreferences = json_decode($profile->preferences, true);
            $preferences = array_merge($preferences, $userPreferences);
        }
        
        // Query for potential matches
        $potentialMatches = User::where('id', '!=', $user->id)
            ->when($preferences['gender'], function($query) use ($preferences) {
                return $query->whereHas('profile', function($q) use ($preferences) {
                    $q->where('gender', $preferences['gender']);
                });
            })
            ->whereBetween('age', [$preferences['age_min'], $preferences['age_max']])
            // Exclude users that the current user has already interacted with
            ->whereNotExists(function($query) use ($user) {
                $query->select(DB::raw(1))
                      ->from('user_matches')
                      ->where('user_id', $user->id)
                      ->whereColumn('target_user_id', 'users.id');
            })
            ->with(['profile', 'photos' => function($query) {
                $query->where('is_primary', true);
            }])
            ->limit(20)
            ->get();
        
        return response()->json($potentialMatches);
    }

    /**
     * Like a user
     */
    public function likeUser(Request $request, $userId)
    {
        $user = $request->user();
        
        // Check if target user exists
        $targetUser = User::find($userId);
        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }
        
        // Check if already liked/passed
        $existingMatch = UserMatch::where('user_id', $user->id)
            ->where('target_user_id', $userId)
            ->first();
            
        if ($existingMatch) {
            $existingMatch->action = 'like';
            $existingMatch->save();
        } else {
            // Create new match record
            UserMatch::create([
                'user_id' => $user->id,
                'target_user_id' => $userId,
                'action' => 'like',
            ]);
        }
        
        // Check if this creates a mutual match
        $mutualMatch = UserMatch::where('user_id', $userId)
            ->where('target_user_id', $user->id)
            ->where('action', 'like')
            ->exists();
        
        return response()->json([
            'message' => 'User liked successfully',
            'is_match' => $mutualMatch
        ]);
    }

    /**
     * Pass on a user
     */
    public function passUser(Request $request, $userId)
    {
        $user = $request->user();
        
        // Check if target user exists
        $targetUser = User::find($userId);
        if (!$targetUser) {
            return response()->json(['message' => 'User not found'], 404);
        }
        
        // Check if already liked/passed
        $existingMatch = UserMatch::where('user_id', $user->id)
            ->where('target_user_id', $userId)
            ->first();
            
        if ($existingMatch) {
            $existingMatch->action = 'pass';
            $existingMatch->save();
        } else {
            // Create new match record
            UserMatch::create([
                'user_id' => $user->id,
                'target_user_id' => $userId,
                'action' => 'pass',
            ]);
        }
        
        return response()->json(['message' => 'User passed successfully']);
    }
}
