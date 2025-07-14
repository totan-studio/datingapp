<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AdminSetting;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    /**
     * Get all admin settings
     */
    public function index(Request $request)
    {
        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        
        $settings = AdminSetting::all();
        return response()->json($settings);
    }

    /**
     * Update a specific setting
     */
    public function update(Request $request, $id)
    {
        // Check if user is admin
        if (!$request->user()->is_admin) {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }
        
        $request->validate([
            'value' => 'required',
        ]);

        $setting = AdminSetting::findOrFail($id);
        $setting->setting_value = json_encode($request->value);
        $setting->updated_by = $request->user()->id;
        $setting->save();

        return response()->json($setting);
    }
}
