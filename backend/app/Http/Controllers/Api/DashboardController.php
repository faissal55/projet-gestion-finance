<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Invoice;
use App\Models\Debt;
use App\Models\Alert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    
    
    public function stats(): JsonResponse
{
    $userId = Auth::id();
 
    // Mois en cours
    $startOfMonth     = now()->startOfMonth();
    $endOfMonth       = now()->endOfMonth();
    $startOfLastMonth = now()->subMonth()->startOfMonth();
    $endOfLastMonth   = now()->subMonth()->endOfMonth();
 
    $totalRevenus  = Transaction::where('user_id', $userId)->revenus()->dateRange($startOfMonth, $endOfMonth)->sum('amount');
    $totalDepenses = Transaction::where('user_id', $userId)->depenses()->dateRange($startOfMonth, $endOfMonth)->sum('amount');
 
    // Si aucune activité ce mois-ci, utilise les 30 derniers jours
    if ($totalRevenus == 0 && $totalDepenses == 0) {
        $startOfMonth  = now()->subDays(30);
        $endOfMonth    = now();
        $totalRevenus  = Transaction::where('user_id', $userId)->revenus()->dateRange($startOfMonth, $endOfMonth)->sum('amount');
        $totalDepenses = Transaction::where('user_id', $userId)->depenses()->dateRange($startOfMonth, $endOfMonth)->sum('amount');
    }
 
    $lastMonthRevenus  = Transaction::where('user_id', $userId)->revenus()->dateRange($startOfLastMonth, $endOfLastMonth)->sum('amount');
    $lastMonthDepenses = Transaction::where('user_id', $userId)->depenses()->dateRange($startOfLastMonth, $endOfLastMonth)->sum('amount');
 
    $variationRevenus  = $lastMonthRevenus  > 0 ? (($totalRevenus  - $lastMonthRevenus)  / $lastMonthRevenus)  * 100 : 0;
    $variationDepenses = $lastMonthDepenses > 0 ? (($totalDepenses - $lastMonthDepenses) / $lastMonthDepenses) * 100 : 0;
 
    $allRevenus  = Transaction::where('user_id', $userId)->revenus()->sum('amount');
    $allDepenses = Transaction::where('user_id', $userId)->depenses()->sum('amount');
    $soldeTresorerie = $allRevenus - $allDepenses;
 
    $facturesEnAttente = Invoice::where('user_id', $userId)
        ->whereIn('status', ['en_attente', 'en_retard'])
        ->sum('amount');
 
    $dettesActives = Debt::where('user_id', $userId)
        ->where('status', 'active')
        ->sum('amount');
 
    return response()->json([
        'solde_actuel'        => $soldeTresorerie,
        'revenus_mois'        => $totalRevenus,
        'depenses_mois'       => $totalDepenses,
        'factures_en_attente' => $facturesEnAttente,
        'dettes_actives'      => $dettesActives,
        'variation_solde'     => 0,
        'variation_revenus'   => round($variationRevenus, 2),
        'variation_depenses'  => round($variationDepenses, 2),
    ]);
}
 

    public function recentTransactions(): JsonResponse
    {
        $transactions = Transaction::where('user_id', Auth::id())
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json($transactions);
    }

    public function recentAlerts(): JsonResponse
    {
        $alerts = Alert::where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->limit(4)
            ->get();

        return response()->json($alerts);
    }

    public function chartData(Request $request): JsonResponse
    {
        $userId = Auth::id();
        $months = $request->get('months', 6);

        $data = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $startDate = $date->copy()->startOfMonth();
            $endDate = $date->copy()->endOfMonth();

            $baseQuery = Transaction::where('user_id', $userId)
                ->dateRange($startDate, $endDate);

            $data[] = [
                'name'     => $date->translatedFormat('M'), // Mois traduit si locale fr
                'revenus'  => (float)(clone $baseQuery)->revenus()->sum('amount'),
                'depenses' => (float)(clone $baseQuery)->depenses()->sum('amount'),
            ];
        }

        return response()->json($data);
    }

    public function categoryData(): JsonResponse
    {
        $userId = Auth::id();
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();

        $categories = Transaction::where('user_id', $userId)
            ->depenses()
            ->dateRange($startOfMonth, $endOfMonth)
            ->selectRaw('category as name, SUM(amount) as value')
            ->groupBy('category')
            ->orderByDesc('value')
            ->get();

        $colors = [
            'var(--color-chart-1)',
            'var(--color-chart-2)',
            'var(--color-chart-3)',
            'var(--color-chart-4)',
            'var(--color-chart-5)',
        ];

        $categories = $categories->map(function ($cat, $index) use ($colors) {
            $cat->fill = $colors[$index % count($colors)];
            return $cat;
        });

        return response()->json($categories);
    }

    public function getExpensesByCategory(): JsonResponse
{
    $userId = Auth::id();
 
    // Essaie d'abord le mois en cours
    $startDate = now()->startOfMonth();
    $endDate   = now()->endOfMonth();
 
    $totalExpenses = Transaction::where('user_id', $userId)
        ->depenses()
        ->dateRange($startDate, $endDate)
        ->sum('amount');
 
    // Si aucune dépense ce mois-ci, prend les 30 derniers jours
    if ($totalExpenses == 0) {
        $startDate = now()->subDays(30);
        $endDate   = now();
        $totalExpenses = Transaction::where('user_id', $userId)
            ->depenses()
            ->dateRange($startDate, $endDate)
            ->sum('amount');
    }
 
    $categories = Transaction::where('user_id', $userId)
        ->depenses()
        ->dateRange($startDate, $endDate)
        ->selectRaw('category, SUM(amount) as amount')
        ->groupBy('category')
        ->orderByDesc('amount')
        ->get()
        ->map(function ($cat) use ($totalExpenses) {
            $cat->percentage = $totalExpenses > 0
                ? round(($cat->amount / $totalExpenses) * 100, 1)
                : 0;
            return $cat;
        });
 
    return response()->json($categories);
}
 

    /**
     * Recommandations calculées depuis la BDD (règles métier).
     * GET /api/dashboard/recommendations
     */
    public function recommendations(): JsonResponse
    {
        $userId = Auth::id();
        $recommendations = [];

        // ── Factures en retard ──
        $overdueInvoices = Invoice::where('user_id', $userId)
            ->whereIn('status', ['overdue', 'en_retard'])
            ->get();

        if ($overdueInvoices->count() > 0) {
            $total = $overdueInvoices->sum('amount');
            $recommendations[] = [
                'type'        => 'warning',
                'title'       => 'Factures en retard',
                'description' => "Vous avez {$overdueInvoices->count()} facture(s) en retard pour un total de "
                               . number_format($total, 0, ',', ' ') . " FCFA. Pensez à relancer vos clients.",
                'action'      => 'Voir les factures',
            ];
        }

        // ── Dettes à échéance proche (14 jours) ──
        $upcomingDebts = Debt::where('user_id', $userId)
            ->where('status', 'active')
            ->whereDate('due_date', '<=', now()->addDays(14))
            ->whereDate('due_date', '>=', now())
            ->get();

        if ($upcomingDebts->count() > 0) {
            $total = $upcomingDebts->sum('amount');
            $recommendations[] = [
                'type'        => 'info',
                'title'       => 'Échéances de dettes proches',
                'description' => "Vous avez {$upcomingDebts->count()} dette(s) à payer dans les 14 prochains jours "
                               . "pour un total de " . number_format($total, 0, ',', ' ') . " FCFA.",
                'action'      => 'Voir les dettes',
            ];
        }

        // ── Tendance des revenus ──
        $currentMonthRevenus = Transaction::where('user_id', $userId)
            ->revenus()
            ->dateRange(now()->startOfMonth(), now()->endOfMonth())
            ->sum('amount');

        $lastMonthRevenus = Transaction::where('user_id', $userId)
            ->revenus()
            ->dateRange(now()->subMonth()->startOfMonth(), now()->subMonth()->endOfMonth())
            ->sum('amount');

        if ($lastMonthRevenus > 0) {
            $variation = (($currentMonthRevenus - $lastMonthRevenus) / $lastMonthRevenus) * 100;

            if ($variation > 10) {
                $recommendations[] = [
                    'type'        => 'success',
                    'title'       => 'Bonne progression des revenus',
                    'description' => "Vos revenus ont augmenté de " . round($variation, 1)
                                   . "% par rapport au mois dernier. Continuez sur cette lancée !",
                    'action'      => 'Voir les rapports',
                ];
            } elseif ($variation < -10) {
                $recommendations[] = [
                    'type'        => 'warning',
                    'title'       => 'Baisse des revenus',
                    'description' => "Vos revenus ont baissé de " . abs(round($variation, 1))
                                   . "% par rapport au mois dernier. Analysez les causes.",
                    'action'      => 'Analyser',
                ];
            }
        }

        // ── Marge nette faible ──
        $currentDepenses = Transaction::where('user_id', $userId)
            ->depenses()
            ->dateRange(now()->startOfMonth(), now()->endOfMonth())
            ->sum('amount');

        if ($currentMonthRevenus > 0) {
            $marge = (($currentMonthRevenus - $currentDepenses) / $currentMonthRevenus) * 100;
            if ($marge < 10 && $marge >= 0 && count($recommendations) < 3) {
                $recommendations[] = [
                    'type'        => 'warning',
                    'title'       => 'Marge nette faible',
                    'description' => "Votre marge nette est de " . round($marge, 1)
                                   . "% ce mois-ci. Réduire les dépenses améliorerait votre rentabilité.",
                    'action'      => 'Voir les dépenses',
                ];
            }
        }

        // Retourne au moins un message si tout va bien
        if (empty($recommendations)) {
            $recommendations[] = [
                'type'        => 'success',
                'title'       => 'Situation financière stable',
                'description' => 'Vos finances sont équilibrées ce mois-ci. Continuez à suivre vos flux régulièrement.',
                'action'      => 'Voir le tableau de bord',
            ];
        }

        return response()->json($recommendations);
    }

    /**
     * Recommandations enrichies par Claude AI (appel serveur → pas de CORS).
     * POST /api/dashboard/recommendations-ai
     *
     * Ajoutez dans routes/api.php (dans le groupe dashboard) :
     *   Route::post('/recommendations-ai', [DashboardController::class, 'recommendationsAi']);
     *
     * Ajoutez dans .env :
     *   ANTHROPIC_API_KEY=sk-ant-...
     *
     * Ajoutez dans config/services.php :
     *   'anthropic' => ['key' => env('ANTHROPIC_API_KEY')],
     */
    public function recommendationsAi(Request $request): JsonResponse
    {
        $data = $request->validate([
            'revenus_mois'        => 'required|numeric',
            'depenses_mois'       => 'required|numeric',
            'solde_actuel'        => 'required|numeric',
            'variation_revenus'   => 'nullable|numeric',
            'variation_depenses'  => 'nullable|numeric',
            'factures_en_retard'  => 'nullable|integer',
            'montant_en_retard'   => 'nullable|numeric',
            'factures_en_attente' => 'nullable|integer',
            'montant_en_attente'  => 'nullable|numeric',
            'categories'          => 'nullable|array',
        ]);

        $apiKey = config('services.anthropic.key', env('ANTHROPIC_API_KEY'));

        if (empty($apiKey)) {
            // Pas de clé → délègue aux recommandations locales
            return $this->recommendations();
        }

        $marge = $data['revenus_mois'] > 0
            ? round((($data['revenus_mois'] - $data['depenses_mois']) / $data['revenus_mois']) * 100, 1)
            : 0;

        $categories = collect($data['categories'] ?? [])
            ->map(fn($c) => "{$c['name']} ({$c['percentage']}%)")
            ->join(', ');

        $prompt = "Tu es un conseiller financier expert pour une PME au Burkina Faso.
Données du mois :
- Revenus : " . number_format($data['revenus_mois'], 0, ',', ' ') . " FCFA (variation : " . ($data['variation_revenus'] ?? 0) . "%)
- Dépenses : " . number_format($data['depenses_mois'], 0, ',', ' ') . " FCFA (variation : " . ($data['variation_depenses'] ?? 0) . "%)
- Solde trésorerie : " . number_format($data['solde_actuel'], 0, ',', ' ') . " FCFA
- Marge nette : {$marge}%
- Factures en retard : " . ($data['factures_en_retard'] ?? 0) . " (" . number_format($data['montant_en_retard'] ?? 0, 0, ',', ' ') . " FCFA)
- Factures en attente : " . ($data['factures_en_attente'] ?? 0) . " (" . number_format($data['montant_en_attente'] ?? 0, 0, ',', ' ') . " FCFA)
- Catégories de dépenses : {$categories}

Génère exactement 3 recommandations financières concrètes.
Réponds UNIQUEMENT en JSON valide, sans backticks ni markdown :
[{\"type\":\"warning\",\"title\":\"Titre court\",\"description\":\"1-2 phrases avec chiffres.\",\"action\":\"Texte bouton\"}]
Types : warning (problème), success (bonne pratique), info (opportunité).";

        try {
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->timeout(30)->post('https://api.anthropic.com/v1/messages', [
                'model'      => 'claude-haiku-4-5-20251001',
                'max_tokens' => 800,
                'messages'   => [['role' => 'user', 'content' => $prompt]],
            ]);

            if (!$response->successful()) {
                Log::warning('Anthropic API error', ['status' => $response->status()]);
                return $this->recommendations();
            }

            $text  = $response->json('content.0.text', '');
            $clean = trim(preg_replace('/```json|```/', '', $text));
            $recs  = json_decode($clean, true);

            if (!is_array($recs) || count($recs) === 0) {
                return $this->recommendations();
            }

            return response()->json($recs);

        } catch (\Exception $e) {
            Log::error('recommendationsAi: ' . $e->getMessage());
            return $this->recommendations();
        }
    }
}