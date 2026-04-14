<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Debt extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'creditor_name',
        'amount',
        'due_date',
        'status',
        'description',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    /**
     * Get the user that owns the debt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get days until due date.
     */
    public function getDaysUntilDue(): int
    {
        return now()->diffInDays($this->due_date, false);
    }

    /**
     * Check if the debt is due soon (within 30 days).
     */
    public function isDueSoon(): bool
    {
        $daysUntilDue = $this->getDaysUntilDue();
        return $this->status === 'active' && $daysUntilDue >= 0 && $daysUntilDue <= 30;
    }

    /**
     * Scope a query to only include active debts.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include paid debts.
     */
    public function scopePayee($query)
    {
        return $query->where('status', 'payee');
    }

    /**
     * Scope a query to get debts due within specified days.
     */
    public function scopeDueWithinDays($query, int $days)
    {
        return $query->active()
            ->whereBetween('due_date', [now(), now()->addDays($days)]);
    }
}
