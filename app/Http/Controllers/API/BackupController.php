<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Process;
use Carbon\Carbon;

class BackupController extends Controller
{
    /**
     * Get list of database backups
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            // Create backups directory if it doesn't exist
            $backupPath = storage_path('app/backups');
            if (!File::exists($backupPath)) {
                File::makeDirectory($backupPath, 0755, true);
            }
            
            // Get list of backup files
            $files = File::files($backupPath);
            
            $backups = [];
            foreach ($files as $file) {
                $backups[] = [
                    'name' => $file->getFilename(),
                    'size' => $file->getSize(),
                    'created_at' => Carbon::createFromTimestamp($file->getMTime())->format('Y-m-d H:i:s'),
                    'path' => $file->getPathname(),
                ];
            }
            
            return response()->json([
                'success' => true,
                'data' => $backups,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get backups: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Create a new database backup
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function create(): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            // Create backups directory if it doesn't exist
            $backupPath = storage_path('app/backups');
            if (!File::exists($backupPath)) {
                File::makeDirectory($backupPath, 0755, true);
            }
            
            // Generate backup filename
            $filename = 'backup_' . date('Y-m-d_H-i-s') . '.sql';
            $filepath = $backupPath . '/' . $filename;
            
            // Get database configuration
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            
            // Create backup command
            $command = "mysqldump --host={$host} --port={$port} --user={$username} --password={$password} {$database} > {$filepath}";
            
            // Execute backup command
            $result = Process::run($command);
            
            if ($result->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Backup created successfully',
                    'data' => [
                        'name' => $filename,
                        'size' => File::size($filepath),
                        'created_at' => date('Y-m-d H:i:s'),
                        'path' => $filepath,
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup failed: ' . $result->errorOutput(),
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Download a database backup
     *
     * @param string $filename
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function download(string $filename)
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            $backupPath = storage_path('app/backups/' . $filename);
            
            if (!File::exists($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found',
                ], 404);
            }
            
            return response()->download($backupPath);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Download failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Restore a database backup
     *
     * @param string $filename
     * @return \Illuminate\Http\JsonResponse
     */
    public function restore(string $filename): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            $backupPath = storage_path('app/backups/' . $filename);
            
            if (!File::exists($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found',
                ], 404);
            }
            
            // Get database configuration
            $host = config('database.connections.mysql.host');
            $port = config('database.connections.mysql.port');
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            
            // Create restore command
            $command = "mysql --host={$host} --port={$port} --user={$username} --password={$password} {$database} < {$backupPath}";
            
            // Execute restore command
            $result = Process::run($command);
            
            if ($result->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Backup restored successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Restore failed: ' . $result->errorOutput(),
                ], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Restore failed: ' . $e->getMessage(),
            ], 500);
        }
    }
    
    /**
     * Delete a database backup
     *
     * @param string $filename
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(string $filename): JsonResponse
    {
        // Check if user is admin
        if (!auth()->user() || !auth()->user()->is_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }
        
        try {
            $backupPath = storage_path('app/backups/' . $filename);
            
            if (!File::exists($backupPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Backup file not found',
                ], 404);
            }
            
            // Delete backup file
            File::delete($backupPath);
            
            return response()->json([
                'success' => true,
                'message' => 'Backup deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
