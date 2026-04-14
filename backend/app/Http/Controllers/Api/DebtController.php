<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Debt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DebtController extends Controller
{
    /**
     * GET /api/debts?status=active&search=banque&per_page=50
     */
    public function index(Request $request): JsonResponse
    {
        $query = Debt::where('user_id', Auth::id());

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('creditor_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $debts = $query
            ->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($debts);
    }

    /**
     * POST /api/debts
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'creditor_name' => 'required|string|max:255',
            'amount'        => 'required|numeric|min:0',
            'due_date'      => 'required|date',
            'status'        => ['nullable', Rule::in(['active', 'payee'])],
            'description'   => 'nullable|string|max:1000',
        ]);

        $debt = Debt::create([
            'creditor_name' => $validated['creditor_name'],
            'amount'        => $validated['amount'],
            'due_date'      => $validated['due_date'],
            'status'        => $validated['status'] ?? 'active',
            'description'   => $validated['description'] ?? null,
            'user_id'       => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Dette enregistrée avec succès',
            'data'    => $debt,
        ], 201);
    }

    /**
     * GET /api/debts/{debt}
     */
    public function show(Debt $debt): JsonResponse
    {
        if ($debt->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json($debt);
    }

    /**
     * PUT /api/debts/{debt}
     */
    public function update(Request $request, Debt $debt): JsonResponse
    {
        if ($debt->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'creditor_name' => 'sometimes|string|max:255',
            'amount'        => 'sometimes|numeric|min:0',
            'due_date'      => 'sometimes|date',
            'status'        => ['sometimes', Rule::in(['active', 'payee'])],
            'description'   => 'nullable|string|max:1000',
        ]);

        $debt->update($validated);

        return response()->json([
            'message' => 'Dette mise à jour avec succès',
            'data'    => $debt->fresh(),
        ]);
    }

    /**
     * DELETE /api/debts/{debt}
     */
    public function destroy(Debt $debt): JsonResponse
    {
        if ($debt->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $debt->delete();

        return response()->json([
            'message' => 'Dette supprimée avec succès',
        ]);
    }

    /**
     * POST /api/debts/{debt}/mark-paid
     */
    public function markAsPaid(Debt $debt): JsonResponse
    {
        if ($debt->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $debt->update(['status' => 'payee']);

        return response()->json([
            'message' => 'Dette marquée comme payée',
            'data'    => $debt->fresh(),
        ]);
    }

    /**
     * GET /api/debts/summary
     */
    public function summary(): JsonResponse
    {
        $userId = Auth::id();
        $today  = now()->toDateString();
        $in30   = now()->addDays(30)->toDateString();

        // Un seul groupBy pour active/payee
        $rows = Debt::where('user_id', $userId)
            ->selectRaw('status, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        // Échéances dans les 30 prochains jours (dettes actives uniquement)
        $upcomingDebts = Debt::where('user_id', $userId)
            ->where('status', 'active')
            ->whereDate('due_date', '>=', $today)
            ->whereDate('due_date', '<=', $in30)
            ->orderBy('due_date', 'asc')
            ->get();

        $build = function (string $key) use ($rows): array {
            return [
                'total' => (float) ($rows[$key]->total ?? 0),
                'count' => (int)   ($rows[$key]->count ?? 0),
            ];
        };

        return response()->json([
            'active'   => $build('active'),
            'paid'     => $build('payee'),
            'upcoming' => [
                'total' => (float) $upcomingDebts->sum('amount'),
                'count' => $upcomingDebts->count(),
                'debts' => $upcomingDebts,
            ],
        ]);
    }
}