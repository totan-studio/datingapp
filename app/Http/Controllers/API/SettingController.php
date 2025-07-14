<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class SettingController extends Controller
{
    /**
     * Display a listing of the public settings.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        $settings = Setting::where('is_public', true)->get();
        
        $formattedSettings = [];
        foreach ($settings as $setting) {
            $formattedSettings[$setting->key] = $setting->value;
        }
        
        return response()->json([
            'success' => true,
            'data' => $formattedSettings,
        ]);
    }

    /**
     * Display settings by group.
     *
     * @param string $group
     * @return \Illuminate\Http\JsonResponse
     */
    public function getByGroup(string $group): JsonResponse
    {
        $settings = Setting::where('group', $group)
            ->where('is_public', true)
            ->get();
        
        $formattedSettings = [];
        foreach ($settings as $setting) {
            $formattedSettings[$setting->key] = $setting->value;
        }
        
        return response()->json([
            'success' => true,
            'data' => $formattedSettings,
        ]);
    }

    /**
     * Display the specified setting.
     *
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)
            ->where('is_public', true)
            ->first();
        
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => [
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
                'description' => $setting->description,
            ],
        ]);
    }

    /**
     * Update the specified setting in storage.
     * Only admin users can update settings.
     *
     * @param \Illuminate\Http\Request $request
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, string $key): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }
        
        $validator = Validator::make($request->all(), [
            'value' => 'required',
            'group' => 'sometimes|string|nullable',
            'description' => 'sometimes|string|nullable',
            'is_public' => 'sometimes|boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }
        
        $setting->value = $request->value;
        
        if ($request->has('group')) {
            $setting->group = $request->group;
        }
        
        if ($request->has('description')) {
            $setting->description = $request->description;
        }
        
        if ($request->has('is_public')) {
            $setting->is_public = $request->is_public;
        }
        
        $setting->save();
        
        return response()->json([
            'success' => true,
            'data' => [
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
                'description' => $setting->description,
                'is_public' => $setting->is_public,
            ],
            'message' => 'Setting updated successfully',
        ]);
    }

    /**
     * Store a newly created setting in storage.
     * Only admin users can create settings.
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'key' => 'required|string|unique:settings,key',
            'value' => 'required',
            'group' => 'nullable|string',
            'description' => 'nullable|string',
            'is_public' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }
        
        $setting = Setting::create([
            'key' => $request->key,
            'value' => $request->value,
            'group' => $request->group,
            'description' => $request->description,
            'is_public' => $request->is_public ?? false,
        ]);
        
        return response()->json([
            'success' => true,
            'data' => [
                'key' => $setting->key,
                'value' => $setting->value,
                'group' => $setting->group,
                'description' => $setting->description,
                'is_public' => $setting->is_public,
            ],
            'message' => 'Setting created successfully',
        ], 201);
    }

    /**
     * Remove the specified setting from storage.
     * Only admin users can delete settings.
     *
     * @param string $key
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $key): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        $setting = Setting::where('key', $key)->first();
        
        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }
        
        $setting->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Setting deleted successfully',
        ]);
    }
}
