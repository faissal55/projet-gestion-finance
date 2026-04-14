<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\DebtController;
use App\Http\Controllers\Api\AlertController;
use App\Http\Controllers\Api\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);





        Route::get('/transactions', [TransactionController::class, 'index']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);
    Route::get('/transactions-summary', [TransactionController::class, 'summary']); // Optionnel pour stats

    // Dashboard routes
    Route::prefix('dashboard')->group(function () {
        Route::get('/stats', [DashboardController::class, 'stats']);
        Route::get('/recent-transactions', [DashboardController::class, 'recentTransactions']);
        Route::get('/recent-alerts', [DashboardController::class, 'recentAlerts']);
        Route::get('/chart-data', [DashboardController::class, 'chartData']);
        Route::get('/category-data', [DashboardController::class, 'categoryData']);
        Route::get('/expenses-by-category', [DashboardController::class, 'getExpensesByCategory']);
        Route::get('/recommendations', [DashboardController::class, 'recommendations']);
    });

    // Transactions routes
    Route::get('/transactions/summary', [TransactionController::class, 'summary']);
    Route::get('/transactions/chart-data', [TransactionController::class, 'chartData']);
    Route::apiResource('transactions', TransactionController::class);

      // Routes custom en PREMIER
    Route::get('/invoices/summary',                   [InvoiceController::class, 'summary']);
    Route::post('/invoices/{invoice}/mark-paid',      [InvoiceController::class, 'markAsPaid']);
    Route::post('/invoices/{invoice}/send-reminder',  [InvoiceController::class, 'sendReminder']);
    // apiResource APRÈS (génère index, store, show, update, destroy)
    Route::apiResource('invoices', InvoiceController::class);

    // Debts routes
    Route::get('/debts/summary', [DebtController::class, 'summary']);
    Route::post('/debts/{debt}/mark-paid', [DebtController::class, 'markAsPaid']);
    Route::apiResource('debts', DebtController::class);

    // Alerts routes
    Route::get('/alerts/summary', [AlertController::class, 'summary']);
    Route::post('/alerts/mark-all-read', [AlertController::class, 'markAllAsRead']);
    Route::delete('/alerts/read', [AlertController::class, 'deleteRead']);
    Route::post('/alerts/{alert}/mark-read', [AlertController::class, 'markAsRead']);
    Route::apiResource('alerts', AlertController::class)->except(['update']);
    Route::post('/alerts/generate', [AlertController::class, 'generate']);

    Route::post('/dashboard/recommendations-ai', [DashboardController::class, 'recommendationsAi']);
    });
    Route::get('/test', function () {
    return response()->json([
        'message' => 'Backend Laravel connecté avec succès'
    ]);
});
