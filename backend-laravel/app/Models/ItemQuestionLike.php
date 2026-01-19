<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemQuestionLike extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'user_id',
    ];

    /**
     * Relacija: Lajk pripada pitanju
     */
    public function question()
    {
        return $this->belongsTo(ItemQuestion::class, 'question_id');
    }

    /**
     * Relacija: Lajk pripada korisniku
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
