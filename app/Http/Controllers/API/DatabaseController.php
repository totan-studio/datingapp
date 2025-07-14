<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;

class DatabaseController extends Controller
{
    /**
     * Get database status and information
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function status(): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            // Test database connection
            DB::connection()->getPdo();
            $connected = true;
            $connection = DB::connection()->getName();
            $database = DB::connection()->getDatabaseName();
            
            // Get tables
            $tables = Schema::getConnection()->getDoctrineSchemaManager()->listTableNames();
            
            // Get table counts
            $tableCounts = [];
            foreach ($tables as $table) {
                $tableCounts[$table] = DB::table($table)->count();
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'connected' => $connected,
                    'connection' => $connection,
                    'database' => $database,
                    'tables' => $tables,
                    'table_counts' => $tableCounts,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Run database migrations
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function migrate(): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            // Run migrations
            Artisan::call('migrate', ['--force' => true]);
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'Migrations completed successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Run database seeders
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function seed(): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            // Run seeders
            Artisan::call('db:seed', ['--force' => true]);
            $output = Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'Database seeding completed successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database seeding failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Reset database (migrate:fresh)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function reset(): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            // Reset database
            Artisan::call('migrate:fresh', ['--force' => true]);
            $output = Artisan::output();
            
            // Run seeders
            Artisan::call('db:seed', ['--force' => true]);
            $output .= Artisan::output();
            
            return response()->json([
                'success' => true,
                'message' => 'Database reset completed successfully',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database reset failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
