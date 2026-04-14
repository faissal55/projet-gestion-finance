<?php

namespace App\Services;

use App\Models\Alert;
use App\Models\Invoice;
use App\Models\Debt;
use App\Models\Transaction;
use Illuminate\Support\Facades\Auth;

class AlertService
{
    /**
     * Génère toutes les alertes pour un utilisateur donné.
     * Appelé après chaque création/modification de facture, dette ou transaction.
     */
    public static function generateForUser(int $userId): void
    {
        self::checkOverdueInvoices($userId);
        self::checkUpcomingInvoices($userId);
        self::checkUpcomingDebts($userId);
        self::checkOverdueDebts($userId);
        self::checkLowTreasury($userId);
    }

    // ── Factures en retard ────────────────────────────────────────────────────

    private static function checkOverdueInvoices(int $userId): void
    {
        $overdue = Invoice::where('user_id', $userId)
            ->whereIn('status', ['en_attente'])
            ->whereDate('due_date', '<', now())
            ->get();

        foreach ($overdue as $invoice) {
            // Marque la facture comme en retard
            $invoice->update(['status' => 'en_retard']);

            self::createIfNotExists($userId, [
                'type'     => 'facture',
                'severity' => 'critical',
                'message'  => "Facture {$invoice->invoice_number} de "
                            . number_format($invoice->amount, 0, ',', ' ')
                            . " FCFA en retard (client : {$invoice->client_name}).",
            ]);
        }
    }

    private static function checkUpcomingInvoices(int $userId): void
    {
        // Factures à échéance dans les 7 prochains jours
        $upcoming = Invoice::where('user_id', $userId)
            ->whereIn('status', ['en_attente'])
            ->whereDate('due_date', '>=', now())
            ->whereDate('due_date', '<=', now()->addDays(7))
            ->get();

        foreach ($upcoming as $invoice) {
            $days = now()->diffInDays($invoice->due_date);
            self::createIfNotExists($userId, [
                'type'     => 'facture',
                'severity' => 'warning',
                'message'  => "Facture {$invoice->invoice_number} de "
                            . number_format($invoice->amount, 0, ',', ' ')
                            . " FCFA arrive à échéance dans {$days} jour(s).",
            ]);
        }
    }

    // ── Dettes ────────────────────────────────────────────────────────────────

    private static function checkUpcomingDebts(int $userId): void
    {
        $upcoming = Debt::where('user_id', $userId)
            ->where('status', 'active')
            ->whereDate('due_date', '>=', now())
            ->whereDate('due_date', '<=', now()->addDays(14))
            ->get();

        foreach ($upcoming as $debt) {
            $days = now()->diffInDays($debt->due_date);
            self::createIfNotExists($userId, [
                'type'     => 'dette',
                'severity' => 'warning',
                'message'  => "Dette \"{$debt->description}\" de "
                            . number_format($debt->amount, 0, ',', ' ')
                            . " FCFA arrive à échéance dans {$days} jour(s).",
            ]);
        }
    }

    private static function checkOverdueDebts(int $userId): void
    {
        $overdue = Debt::where('user_id', $userId)
            ->where('status', 'active')
            ->whereDate('due_date', '<', now())
            ->get();

        foreach ($overdue as $debt) {
            self::createIfNotExists($userId, [
                'type'     => 'dette',
                'severity' => 'critical',
                'message'  => "Dette \"{$debt->description}\" de "
                            . number_format($debt->amount, 0, ',', ' ')
                            . " FCFA est en retard de paiement.",
            ]);
        }
    }

    // ── Trésorerie faible ─────────────────────────────────────────────────────

    private static function checkLowTreasury(int $userId): void
    {
        $revenus  = Transaction::where('user_id', $userId)->revenus()->sum('amount');
        $depenses = Transaction::where('user_id', $userId)->depenses()->sum('amount');
        $solde    = $revenus - $depenses;

        // Alerte si solde négatif
        if ($solde < 0) {
            self::createIfNotExists($userId, [
                'type'     => 'tresorerie',
                'severity' => 'critical',
                'message'  => "Votre solde de trésorerie est négatif : "
                            . number_format($solde, 0, ',', ' ') . " FCFA.",
            ]);
        }
        // Alerte si solde faible (< 10% des revenus du mois)
        elseif ($revenus > 0 && ($solde / $revenus) < 0.1) {
            self::createIfNotExists($userId, [
                'type'     => 'tresorerie',
                'severity' => 'warning',
                'message'  => "Votre trésorerie est faible : "
                            . number_format($solde, 0, ',', ' ')
                            . " FCFA disponibles. Pensez à anticiper vos prochaines dépenses.",
            ]);
        }
    }

    // ── Helper : crée l'alerte seulement si elle n'existe pas déjà ────────────

    private static function createIfNotExists(int $userId, array $data): void
    {
        // Evite les doublons : même type + même message dans les 24h
        $exists = Alert::where('user_id', $userId)
            ->where('type', $data['type'])
            ->where('message', $data['message'])
            ->where('created_at', '>=', now()->subHours(24))
            ->exists();

        if (!$exists) {
            Alert::create([
                'user_id'  => $userId,
                'type'     => $data['type'],
                'severity' => $data['severity'],
                'message'  => $data['message'],
                'is_read'  => false,
            ]);
        }
    }
}