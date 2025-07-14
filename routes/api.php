<?php

use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\MatchController;
use App\Http\Controllers\API\MessageController;
use App\Http\Controllers\API\ProfileController;
use App\Http\Controllers\API\SettingController;
use App\Http\Controllers\API\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);

// Public settings routes
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/settings/{key}', [SettingController::class, 'show']);
Route::get('/settings/group/{group}', [SettingController::class, 'getByGroup']);

// Admin routes moved to admin.php

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::delete('/user', [UserController::class, 'destroy']);
    Route::post('/user/logout', [UserController::class, 'logout']);
    
    // Profile routes
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile', [ProfileController::class, 'store']);
    Route::put('/profile', [ProfileController::class, 'update']);
    
    // Photo routes
    Route::post('/photos', [ProfileController::class, 'uploadPhoto']);
    Route::delete('/photos/{photo}', [ProfileController::class, 'deletePhoto']);
    Route::put('/photos/{photo}/primary', [ProfileController::class, 'setPrimaryPhoto']);
    
    // Match routes
    Route::get('/matches', [MatchController::class, 'index']);
    Route::get('/matches/potential', [MatchController::class, 'getPotentialMatches']);
    Route::post('/matches/{userId}/like', [MatchController::class, 'likeUser']);
    Route::post('/matches/{userId}/pass', [MatchController::class, 'passUser']);
    
    // Message routes
    Route::get('/messages', [MessageController::class, 'getConversations']);
    Route::get('/messages/{userId}', [MessageController::class, 'getMessages']);
    Route::post('/messages/{userId}', [MessageController::class, 'sendMessage']);
    Route::put('/messages/{message}/read', [MessageController::class, 'markAsRead']);
    
    // Admin routes moved to admin.php
});