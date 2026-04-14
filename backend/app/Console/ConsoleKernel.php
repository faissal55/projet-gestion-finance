<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    // Enregistre vos commandes Artisan custom
    protected $commands = [
        \App\Console\Commands\GenerateAlertsCommand::class,
    ];

    // Planification automatique des tâches
    protected function schedule(Schedule $schedule): void
    {
        // Génère les alertes tous les jours à 8h00
        $schedule->command('alerts:generate')->dailyAt('08:00');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }
}