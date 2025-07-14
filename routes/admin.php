<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\AdminSettingsController;
use App\Http\Controllers\API\BackupController;
use App\Http\Controllers\API\DatabaseController;
use App\Http\Controllers\API\SettingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Admin check route
Route::middleware('auth:sanctum')->prefix('api/admin')->group(function () {
    Route::get('/check', function (Request $request) {
        if ($request->user()->is_admin) {
            return response()->json(['message' => 'You are an admin!']);
        }
        return response()->json(['message' => 'You are not an admin.'], 403);
    });
});

// Admin routes (protected by admin check in controller)
Route::middleware('auth:sanctum')->prefix('api/admin')->group(function () {
    // User management
    Route::get('/users', [AdminController::class, 'getUsers']);
    Route::get('/users/{user}', [AdminController::class, 'getUser']);
    Route::put('/users/{user}', [AdminController::class, 'updateUser']);
    Route::delete('/users/{user}', [AdminController::class, 'deleteUser']);
    
    // Admin settings management (legacy)
    Route::get('/settings', [AdminSettingsController::class, 'index']);
    Route::put('/settings/{id}', [AdminSettingsController::class, 'update']);
    
    // New settings management
    Route::post('/app-settings', [SettingController::class, 'store']);
    Route::put('/app-settings/{key}', [SettingController::class, 'update']);
    Route::delete('/app-settings/{key}', [SettingController::class, 'destroy']);
    
    // Database management
    Route::get('/database/status', [DatabaseController::class, 'status']);
    Route::post('/database/migrate', [DatabaseController::class, 'migrate']);
    Route::post('/database/seed', [DatabaseController::class, 'seed']);
    Route::post('/database/reset', [DatabaseController::class, 'reset']);
    
    // Backup management
    Route::get('/backups', [BackupController::class, 'index']);
    Route::post('/backups', [BackupController::class, 'create']);
    Route::get('/backups/{filename}', [BackupController::class, 'download']);
    Route::post('/backups/{filename}/restore', [BackupController::class, 'restore']);
    Route::delete('/backups/{filename}', [BackupController::class, 'destroy']);
});