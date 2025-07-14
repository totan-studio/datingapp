<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;
    
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'chat_id',
        'sender_id',
        'recipient_id',
        'message',
        'is_read',
    ];
    
    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_read' => 'boolean',
    ];
    
    /**
     * Get the sender of the message.
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
    
    /**
     * Get the recipient of the message.
     */
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
    
    /**
     * Create a chat ID from two user IDs.
     * 
     * @param int $userId1
     * @param int $userId2
     * @return string
     */
    public static function createChatId($userId1, $userId2)
    {
        // Sort the IDs to ensure consistency
        $ids = [$userId1, $userId2];
        sort($ids);
        return implode('_', $ids);
    }
}
