<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use App\Models\Photo;
use App\Models\AdminSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'age' => 30,
                'is_admin' => true,
                'is_online' => false,
                'last_active_at' => now(),
            ]
        );
        
        // Create admin profile
        Profile::updateOrCreate(
            ['user_id' => $admin->id],
            [
                'bio' => 'System administrator',
                'gender' => 'Other',
                'location' => 'System',
            ]
        );
        
        // Create regular users
        $user1 = User::updateOrCreate(
            ['email' => 'john@example.com'],
            [
                'name' => 'John Doe',
                'password' => Hash::make('password'),
                'age' => 28,
                'is_online' => false,
                'last_active_at' => now()->subHours(2),
            ]
        );
        
        Profile::updateOrCreate(
            ['user_id' => $user1->id],
            [
                'bio' => 'I love hiking and outdoor activities',
                'gender' => 'Male',
                'location' => 'New York',
                'interests' => json_encode(['hiking', 'camping', 'photography']),
                'preferences' => json_encode(['gender' => 'Female', 'age_min' => 25, 'age_max' => 35]),
            ]
        );
        
        Photo::updateOrCreate(
            [
                'user_id' => $user1->id,
                'is_primary' => true,
            ],
            [
                'photo_url' => 'https://randomuser.me/api/portraits/men/1.jpg',
                'order' => 1,
            ]
        );
        
        $user2 = User::updateOrCreate(
            ['email' => 'jane@example.com'],
            [
                'name' => 'Jane Smith',
                'password' => Hash::make('password'),
                'age' => 26,
                'is_online' => true,
                'last_active_at' => now(),
            ]
        );
        
        Profile::updateOrCreate(
            ['user_id' => $user2->id],
            [
                'bio' => 'I enjoy reading books and watching movies',
                'gender' => 'Female',
                'location' => 'Los Angeles',
                'interests' => json_encode(['reading', 'movies', 'travel']),
                'preferences' => json_encode(['gender' => 'Male', 'age_min' => 25, 'age_max' => 40]),
            ]
        );
        
        Photo::updateOrCreate(
            [
                'user_id' => $user2->id,
                'is_primary' => true,
            ],
            [
                'photo_url' => 'https://randomuser.me/api/portraits/women/1.jpg',
                'order' => 1,
            ]
        );
        
        // Create some admin settings
        AdminSetting::updateOrCreate(
            ['setting_key' => 'app_name'],
            [
                'setting_value' => json_encode('Dating App'),
                'description' => 'Application name',
                'updated_by' => $admin->id,
            ]
        );
        
        AdminSetting::updateOrCreate(
            ['setting_key' => 'max_photos'],
            [
                'setting_value' => json_encode(6),
                'description' => 'Maximum number of photos per user',
                'updated_by' => $admin->id,
            ]
        );
        
        AdminSetting::updateOrCreate(
            ['setting_key' => 'min_age'],
            [
                'setting_value' => json_encode(18),
                'description' => 'Minimum age for registration',
                'updated_by' => $admin->id,
            ]
        );
    }
}
