<?php
/**
 * CDN Test Endpoint
 * GET /api/test.php — Verify PHP and configuration are working
 */

header('Content-Type: application/json');

$result = [
    'status' => 'ok',
    'message' => 'CDN API is working!',
    'php_version' => phpversion(),
    'upload_dir' => __DIR__ . '/../uploads/',
    'upload_dir_exists' => is_dir(__DIR__ . '/../uploads/'),
    'upload_dir_writable' => is_writable(__DIR__ . '/../uploads/'),
    'config_loaded' => file_exists(__DIR__ . '/../config.php'),
    'max_upload_size' => ini_get('upload_max_filesize'),
    'max_post_size' => ini_get('post_max_size'),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
];

echo json_encode($result, JSON_PRETTY_PRINT);
