<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    /**
     * Liste des transactions (avec recherche et filtre)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::where('user_id', Auth::id());

        // Filtre type
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        // Recherche par description ou catégorie
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('date', 'desc')->get();

        return response()->json($transactions);
    }

    /**
     * Créer une nouvelle transaction
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(['revenu', 'depense'])],
            'category' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $transaction = Transaction::create([
            ...$validated,
            'user_id' => Auth::id(),
        ]);

        return response()->json($transaction, 201);
    }

    /**
     * Modifier une transaction existante
     */
    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        // Vérifie que l'utilisateur est propriétaire
        if ($transaction->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'type' => [Rule::in(['revenu', 'depense'])],
            'category' => 'string|max:255',
            'amount' => 'numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'date',
        ]);

        $transaction->update($validated);

        return response()->json($transaction);
    }

    /**
     * Supprimer une transaction
     */
    public function destroy(Transaction $transaction): JsonResponse
    {
        if ($transaction->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $transaction->delete();

        return response()->json(['message' => 'Transaction supprimée']);
    }

    /**
     * Résumé des transactions (optionnel pour ton frontend)
     */
    public function summary(): JsonResponse
    {
        $transactions = Transaction::where('user_id', Auth::id())->get();

        $totalRevenus = $transactions->where('type', 'revenu')->sum('amount');
        $totalDepenses = $transactions->where('type', 'depense')->sum('amount');

        return response()->json([
            'total_revenus' => $totalRevenus,
            'total_depenses' => $totalDepenses,
            'solde' => $totalRevenus - $totalDepenses,
        ]);
    }
}