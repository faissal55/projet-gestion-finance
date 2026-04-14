<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'client_name',
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
     * Get the user that owns the invoice.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the invoice is overdue.
     */
    public function isOverdue(): bool
    {
        return $this->status === 'en_attente' && $this->due_date->isPast();
    }

    /**
     * Scope a query to only include pending invoices.
     */
    public function scopeEnAttente($query)
    {
        return $query->where('status', 'en_attente');
    }

    /**
     * Scope a query to only include paid invoices.
     */
    public function scopePayee($query)
    {
        return $query->where('status', 'payee');
    }

    /**
     * Scope a query to only include overdue invoices.
     */
    public function scopeEnRetard($query)
    {
        return $query->where('status', 'en_retard');
    }

    /**
     * Update status to overdue if past due date.
     */
    public function checkAndUpdateOverdueStatus(): void
    {
        if ($this->isOverdue()) {
            $this->update(['status' => 'en_retard']);
        }
    }
}
