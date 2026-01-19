<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'user_id',
        'question',
        'answer',
        'answered_at',
        'answered_by',
        'likes_count',
        'is_reported',
        'is_hidden',
    ];

    protected $casts = [
        'answered_at' => 'datetime',
        'is_reported' => 'boolean',
        'is_hidden' => 'boolean',
    ];

    /**
     * Relacija: Pitanje pripada oglasu
     */
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    /**
     * Relacija: Pitanje pripada korisniku (autor pitanja)
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relacija: Korisnik koji je odgovorio
     */
    public function answeredBy()
    {
        return $this->belongsTo(User::class, 'answered_by');
    }

    /**
     * Relacija: Lajkovi na pitanje
     */
    public function likes()
    {
        return $this->hasMany(ItemQuestionLike::class, 'question_id');
    }

    /**
     * Relacija: Prijave na pitanje
     */
    public function reports()
    {
        return $this->hasMany(ItemQuestionReport::class, 'question_id');
    }
}
