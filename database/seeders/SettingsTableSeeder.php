<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Application settings
        Setting::set('app_name', 'Dating App', 'app', 'Application name', true);
        Setting::set('app_description', 'Find your perfect match', 'app', 'Application description', true);
        Setting::set('app_url', 'https://rodost.com', 'app', 'Application URL', true);
        Setting::set('app_logo', '/images/logo.png', 'app', 'Application logo path', true);
        Setting::set('app_favicon', '/images/favicon.ico', 'app', 'Application favicon path', true);
        
        // User settings
        Setting::set('min_age', 18, 'user', 'Minimum age for registration', true);
        Setting::set('max_photos', 6, 'user', 'Maximum number of photos per user', true);
        Setting::set('max_matches_per_day', 20, 'user', 'Maximum number of matches per day', true);
        
        // Email settings
        Setting::set('mail_from_address', 'noreply@rodost.com', 'mail', 'From email address', false);
        Setting::set('mail_from_name', 'Dating App', 'mail', 'From name for emails', false);
        
        // Social media settings
        Setting::set('facebook_url', 'https://facebook.com/datingapp', 'social', 'Facebook page URL', true);
        Setting::set('twitter_url', 'https://twitter.com/datingapp', 'social', 'Twitter profile URL', true);
        Setting::set('instagram_url', 'https://instagram.com/datingapp', 'social', 'Instagram profile URL', true);
    }
}
