<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AdminController extends Controller
{
    /**
     * Get all users (admin only)
     */
    public function getUsers(Request $request)
    {
        $users = User::with('profile', 'photos')
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return response()->json($users);
    }

    /**
     * Get a specific user (admin only)
     */
    public function getUser(Request $request, $userId)
    {
        $user = User::with('profile', 'photos', 'initiatedMatches', 'receivedMatches')
            ->findOrFail($userId);
        
        return response()->json($user);
    }

    /**
     * Update a user (admin only)
     */
    public function updateUser(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
            'is_admin' => 'sometimes|boolean',
            'is_online' => 'sometimes|boolean',
            'age' => 'sometimes|integer|min:18',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        
        if ($request->has('is_admin')) {
            $user->is_admin = $request->is_admin;
        }
        
        if ($request->has('is_online')) {
            $user->is_online = $request->is_online;
        }
        
        if ($request->has('age')) {
            $user->age = $request->age;
        }
        
        $user->save();
        
        return response()->json($user);
    }

    /**
     * Delete a user (admin only)
     */
    public function deleteUser(Request $request, $userId)
    {
        $user = User::findOrFail($userId);
        
        // Don't allow deleting yourself
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own admin account'], 400);
        }
        
        // Delete user (cascades to profile, photos, matches, messages)
        $user->delete();
        
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get all settings (admin only)
     */
    public function getSettings(Request $request)
    {
        $settings = AdminSetting::all();
        
        // Format settings for easier consumption
        $formattedSettings = $settings->mapWithKeys(function ($setting) {
            return [$setting->setting_key => [
                'id' => $setting->id,
                'value' => json_decode($setting->setting_value),
                'description' => $setting->description,
                'updated_by' => $setting->updated_by,
                'updated_at' => $setting->updated_at,
            ]];
        });
        
        return response()->json($formattedSettings);
    }

    /**
     * Update a setting (admin only)
     */
    public function updateSetting(Request $request, $settingKey)
    {
        $validator = Validator::make($request->all(), [
            'value' => 'required',
            'description' => 'sometimes|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $setting = AdminSetting::where('setting_key', $settingKey)->first();
        
        if (!$setting) {
            // Create new setting
            $setting = new AdminSetting([
                'setting_key' => $settingKey,
                'setting_value' => json_encode($request->value),
                'description' => $request->description ?? $settingKey,
                'updated_by' => $request->user()->id,
            ]);
        } else {
            // Update existing setting
            $setting->setting_value = json_encode($request->value);
            
            if ($request->has('description')) {
                $setting->description = $request->description;
            }
            
            $setting->updated_by = $request->user()->id;
        }
        
        $setting->save();
        
        return response()->json([
            'id' => $setting->id,
            'key' => $setting->setting_key,
            'value' => json_decode($setting->setting_value),
            'description' => $setting->description,
            'updated_by' => $setting->updated_by,
            'updated_at' => $setting->updated_at,
        ]);
    }
}
