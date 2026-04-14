<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AlertController extends Controller
{
    /**
     * GET /api/alerts
     * Params: type (budget|invoice|debt|transaction), is_read (true|false), per_page, page
     */
    public function index(Request $request): JsonResponse
    {
        $query = Alert::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc');

        // Filtre par type — valeurs BDD : budget, invoice, debt, transaction
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filtre lu/non lu — accepte true/false/1/0/"true"/"false"
        if ($request->has('is_read')) {
            $isRead = filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_read', $isRead);
        }

        $alerts = $query->paginate($request->integer('per_page', 15));

        return response()->json($alerts);
    }

    /**
     * GET /api/alerts/summary
     */
    public function summary(): JsonResponse
    {
        $userId = Auth::id();

        $total    = Alert::where('user_id', $userId)->count();
        $unread   = Alert::where('user_id', $userId)->where('is_read', false)->count();
        $critical = Alert::where('user_id', $userId)->where('is_read', false)->where('severity', 'critical')->count();
        $warning  = Alert::where('user_id', $userId)->where('is_read', false)->where('severity', 'warning')->count();
        $info     = Alert::where('user_id', $userId)->where('is_read', false)->where('severity', 'info')->count();

        return response()->json([
            'total'    => $total,
            'unread'   => $unread,
            'critical' => $critical,
            'warning'  => $warning,
            'info'     => $info,
        ]);
    }

    /**
     * POST /api/alerts/{alert}/mark-read
     */
    public function markAsRead(Alert $alert): JsonResponse
    {
        if ($alert->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $alert->update(['is_read' => true]);

        return response()->json(['message' => 'Alerte marquée comme lue']);
    }

    /**
     * POST /api/alerts/mark-all-read
     */
    public function markAllAsRead(): JsonResponse
    {
        Alert::where('user_id', Auth::id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'Toutes les alertes marquées comme lues']);
    }

    /**
     * DELETE /api/alerts/{alert}
     */
    public function destroy(Alert $alert): JsonResponse
    {
        if ($alert->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $alert->delete();

        return response()->json(['message' => 'Alerte supprimée']);
    }

    /**
     * DELETE /api/alerts/read
     */
    public function deleteRead(): JsonResponse
    {
        Alert::where('user_id', Auth::id())
            ->where('is_read', true)
            ->delete();

        return response()->json(['message' => 'Alertes lues supprimées']);
    }
    public function generate(): JsonResponse
{
    \App\Services\AlertService::generateForUser(Auth::id());
    return response()->json(['message' => 'Alertes générées']);
}
}