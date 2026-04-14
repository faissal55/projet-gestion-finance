<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Alert;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     * GET /api/invoices?status=en_attente&search=acme&per_page=50
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::where('user_id', Auth::id());

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('client_name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $invoices = $query
            ->orderBy('due_date', 'asc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->integer('per_page', 15));

        return response()->json($invoices);
    }

    /**
     * Store a newly created invoice.
     * POST /api/invoices
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'client_name' => 'required|string|max:255',
            'amount'      => 'required|numeric|min:0',
            'due_date'    => 'required|date',
            'status'      => ['nullable', Rule::in(['en_attente', 'payee', 'en_retard'])],
            'description' => 'nullable|string|max:1000',
        ]);

        $invoice = Invoice::create([
            'client_name' => $validated['client_name'],
            'amount'      => $validated['amount'],
            'due_date'    => $validated['due_date'],
            'status'      => $validated['status'] ?? 'en_attente',
            'description' => $validated['description'] ?? null,
            'user_id'     => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Facture créée avec succès',
            'data'    => $invoice,
        ], 201);
    }

    /**
     * Display the specified invoice.
     * GET /api/invoices/{invoice}
     */
    public function show(Invoice $invoice): JsonResponse
    {
        if ($invoice->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        return response()->json($invoice);
    }

    /**
     * Update the specified invoice.
     * PUT /api/invoices/{invoice}
     */
    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        if ($invoice->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'client_name' => 'sometimes|string|max:255',
            'amount'      => 'sometimes|numeric|min:0',
            'due_date'    => 'sometimes|date',
            'status'      => ['sometimes', Rule::in(['en_attente', 'payee', 'en_retard'])],
            'description' => 'nullable|string|max:1000',
        ]);

        $invoice->update($validated);

        return response()->json([
            'message' => 'Facture mise à jour avec succès',
            'data'    => $invoice->fresh(),
        ]);
    }

    /**
     * Remove the specified invoice.
     * DELETE /api/invoices/{invoice}
     */
    public function destroy(Invoice $invoice): JsonResponse
    {
        if ($invoice->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $invoice->delete();

        return response()->json([
            'message' => 'Facture supprimée avec succès',
        ]);
    }

    /**
     * Mark invoice as paid.
     * POST /api/invoices/{invoice}/mark-paid
     */
    public function markAsPaid(Invoice $invoice): JsonResponse
    {
        if ($invoice->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $invoice->update(['status' => 'payee']);

        return response()->json([
            'message' => 'Facture marquée comme payée',
            'data'    => $invoice->fresh(),
        ]);
    }

    /**
     * Send reminder for an invoice.
     * POST /api/invoices/{invoice}/send-reminder
     */
    public function sendReminder(Invoice $invoice): JsonResponse
    {
        if ($invoice->user_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        Alert::create([
            'user_id'  => Auth::id(),
            'type'     => 'facture',
            'message'  => "Relance envoyée pour la facture de {$invoice->client_name} ({$invoice->amount} FCFA)",
            'severity' => 'info',
        ]);

        return response()->json([
            'message' => 'Relance envoyée avec succès',
        ]);
    }

    /**
     * Get invoice summary (totals + counts per status).
     * GET /api/invoices/summary
     */
    public function summary(): JsonResponse
    {
        $userId = Auth::id();

        $rows = Invoice::where('user_id', $userId)
            ->selectRaw('status, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('status')
            ->get()
            ->keyBy('status');

        $build = function (string $key) use ($rows): array {
            return [
                'total' => (float) ($rows[$key]->total ?? 0),
                'count' => (int)   ($rows[$key]->count ?? 0),
            ];
        };

        return response()->json([
            'en_attente' => $build('en_attente'),
            'en_retard'  => $build('en_retard'),
            'payee'      => $build('payee'),
        ]);
    }
}