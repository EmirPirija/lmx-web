<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellerSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'show_phone',
        'show_email',
        'show_whatsapp',
        'show_viber',
        'whatsapp_number',
        'viber_number',
        'preferred_contact_method',
        'business_hours',
        'response_time',
        'accepts_offers',
        'auto_reply_enabled',
        'auto_reply_message',
        'vacation_mode',
        'vacation_message',
        'vacation_start',
        'vacation_end',
        'business_description',
        'return_policy',
        'shipping_info',
        'social_facebook',
        'social_instagram',
        'social_tiktok',
        'social_youtube',
        'social_website',
    ];

    protected $casts = [
        'show_phone' => 'boolean',
        'show_email' => 'boolean',
        'show_whatsapp' => 'boolean',
        'show_viber' => 'boolean',
        'accepts_offers' => 'boolean',
        'auto_reply_enabled' => 'boolean',
        'vacation_mode' => 'boolean',
        'vacation_start' => 'datetime',
        'vacation_end' => 'datetime',
        'business_hours' => 'array',
    ];

    /**
     * Relacija: Postavke pripadaju korisniku
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Accessor: Provjeri da li je korisnik na odmoru
     */
    public function getIsOnVacationAttribute()
    {
        if (!$this->vacation_mode) {
            return false;
        }

        $now = now();

        if ($this->vacation_start && $this->vacation_end) {
            return $now->between($this->vacation_start, $this->vacation_end);
        }

        return $this->vacation_mode;
    }
}
