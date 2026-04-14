<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('client_name');
            $table->decimal('amount', 15, 2);
            $table->date('due_date');
            $table->enum('status', ['en_attente', 'payee', 'en_retard'])->default('en_attente');
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
