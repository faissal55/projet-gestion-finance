<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\AlertService;
use Illuminate\Console\Command;

/**
 * Commande à planifier dans app/Console/Kernel.php :
 *
 *   protected function schedule(Schedule $schedule): void
 *   {
 *       $schedule->command('alerts:generate')->dailyAt('08:00');
 *   }
 *
 * Exécution manuelle : php artisan alerts:generate
 */
class GenerateAlertsCommand extends Command
{
    protected $signature   = 'alerts:generate';
    protected $description = 'Génère les alertes automatiques pour tous les utilisateurs';

    public function handle(): void
    {
        $users = User::all();
        $bar   = $this->output->createProgressBar($users->count());

        foreach ($users as $user) {
            AlertService::generateForUser($user->id);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Alertes générées pour {$users->count()} utilisateur(s).");
    }
}