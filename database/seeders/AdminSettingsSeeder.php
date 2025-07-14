<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'setting_key' => 'site_name',
                'setting_value' => json_encode('Dating App'),
                'description' => 'The name of the site',
            ],
            [
                'setting_key' => 'site_description',
                'setting_value' => json_encode('A dating app for finding your perfect match'),
                'description' => 'The description of the site',
            ],
            [
                'setting_key' => 'max_photos',
                'setting_value' => json_encode(6),
                'description' => 'Maximum number of photos a user can upload',
            ],
            [
                'setting_key' => 'min_age',
                'setting_value' => json_encode(18),
                'description' => 'Minimum age required to use the app',
            ],
            [
                'setting_key' => 'max_age',
                'setting_value' => json_encode(99),
                'description' => 'Maximum age allowed to use the app',
            ],
            [
                'setting_key' => 'maintenance_mode',
                'setting_value' => json_encode(false),
                'description' => 'Whether the site is in maintenance mode',
            ],
        ];

        foreach ($settings as $setting) {
            \App\Models\AdminSetting::updateOrCreate(
                ['setting_key' => $setting['setting_key']],
                $setting
            );
        }
    }
}
