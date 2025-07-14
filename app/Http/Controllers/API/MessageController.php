<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use App\Models\UserMatch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    /**
     * Get all conversations for the authenticated user
     */
    public function getConversations(Request $request)
    {
        $user = $request->user();
        
        // Get all users that the current user has exchanged messages with
        $conversations = DB::table('messages')
            ->select('sender_id', 'recipient_id')
            ->where('sender_id', $user->id)
            ->orWhere('recipient_id', $user->id)
            ->get();
        
        // Extract unique user IDs (conversation partners)
        $userIds = collect();
        foreach ($conversations as $conversation) {
            if ($conversation->sender_id != $user->id) {
                $userIds->push($conversation->sender_id);
            }
            if ($conversation->recipient_id != $user->id) {
                $userIds->push($conversation->recipient_id);
            }
        }
        $userIds = $userIds->unique()->values();
        
        // Get the users with their latest message
        $conversationUsers = User::whereIn('id', $userIds)
            ->with(['profile', 'primaryPhoto'])
            ->get()
            ->map(function ($conversationUser) use ($user) {
                // Get the latest message between these users
                $latestMessage = Message::where(function($query) use ($user, $conversationUser) {
                        $query->where('sender_id', $user->id)
                              ->where('recipient_id', $conversationUser->id);
                    })
                    ->orWhere(function($query) use ($user, $conversationUser) {
                        $query->where('sender_id', $conversationUser->id)
                              ->where('recipient_id', $user->id);
                    })
                    ->orderBy('created_at', 'desc')
                    ->first();
                
                // Count unread messages
                $unreadCount = Message::where('sender_id', $conversationUser->id)
                    ->where('recipient_id', $user->id)
                    ->where('is_read', false)
                    ->count();
                
                // Add these properties to the user object
                $conversationUser->latest_message = $latestMessage;
                $conversationUser->unread_count = $unreadCount;
                
                return $conversationUser;
            });
        
        return response()->json($conversationUsers);
    }

    /**
     * Get messages between the authenticated user and another user
     */
    public function getMessages(Request $request, $userId)
    {
        $user = $request->user();
        
        // Check if the other user exists
        $otherUser = User::find($userId);
        if (!$otherUser) {
            return response()->json(['message' => 'User not found'], 404);
        }
        
        // Check if these users have matched
        $hasMatched = UserMatch::where(function($query) use ($user, $userId) {
                $query->where('user_id', $user->id)
                      ->where('target_user_id', $userId)
                      ->where('action', 'like');
            })
            ->whereExists(function($query) use ($user, $userId) {
                $query->select(DB::raw(1))
                      ->from('user_matches')
                      ->where('user_id', $userId)
                      ->where('target_user_id', $user->id)
                      ->where('action', 'like');
            })
            ->exists();
            
        if (!$hasMatched) {
            return response()->json(['message' => 'You must match with this user before messaging'], 403);
        }
        
        // Get messages between these users
        $messages = Message::where(function($query) use ($user, $userId) {
                $query->where('sender_id', $user->id)
                      ->where('recipient_id', $userId);
            })
            ->orWhere(function($query) use ($user, $userId) {
                $query->where('sender_id', $userId)
                      ->where('recipient_id', $user->id);
            })
            ->orderBy('created_at', 'asc')
            ->get();
        
        // Mark messages from the other user as read
        Message::where('sender_id', $userId)
            ->where('recipient_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);
        
        return response()->json($messages);
    }

    /**
     * Send a message to another user
     */
    public function sendMessage(Request $request, $userId)
    {
        $user = $request->user();
        
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Check if the other user exists
        $otherUser = User::find($userId);
        if (!$otherUser) {
            return response()->json(['message' => 'User not found'], 404);
        }
        
        // Check if these users have matched
        $hasMatched = UserMatch::where(function($query) use ($user, $userId) {
                $query->where('user_id', $user->id)
                      ->where('target_user_id', $userId)
                      ->where('action', 'like');
            })
            ->whereExists(function($query) use ($user, $userId) {
                $query->select(DB::raw(1))
                      ->from('user_matches')
                      ->where('user_id', $userId)
                      ->where('target_user_id', $user->id)
                      ->where('action', 'like');
            })
            ->exists();
            
        if (!$hasMatched) {
            return response()->json(['message' => 'You must match with this user before messaging'], 403);
        }
        
        // Create the message
        $message = Message::create([
            'sender_id' => $user->id,
            'recipient_id' => $userId,
            'content' => $request->content,
            'is_read' => false,
        ]);
        
        return response()->json($message, 201);
    }

    /**
     * Mark a message as read
     */
    public function markAsRead(Request $request, Message $message)
    {
        $user = $request->user();
        
        // Check if the message is for this user
        if ($message->recipient_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $message->is_read = true;
        $message->save();
        
        return response()->json($message);
    }
}
