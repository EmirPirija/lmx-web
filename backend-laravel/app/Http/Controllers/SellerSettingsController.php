<?php

namespace App\Http\Controllers;

use App\Models\SellerSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SellerSettingsController extends Controller
{
    /**
     * Dohvati postavke prodavača
     */
    public function getSettings(Request $request)
    {
        $userId = Auth::id();

        $settings = SellerSetting::where('user_id', $userId)->first();

        if (!$settings) {
            // Kreiraj default postavke
            $settings = SellerSetting::create([
                'user_id' => $userId,
            ]);
        }

        return response()->json([
            'error' => false,
            'message' => 'Postavke uspješno dohvaćene',
            'data' => $settings,
        ]);
    }

    /**
     * Ažuriraj postavke prodavača
     */
    public function updateSettings(Request $request)
    {
        $userId = Auth::id();

        $validator = Validator::make($request->all(), [
            'show_phone' => 'nullable|boolean',
            'show_email' => 'nullable|boolean',
            'show_whatsapp' => 'nullable|boolean',
            'show_viber' => 'nullable|boolean',
            'whatsapp_number' => 'nullable|string|max:20',
            'viber_number' => 'nullable|string|max:20',
            'preferred_contact_method' => 'nullable|string|in:message,phone,whatsapp,viber,email',
            'business_hours' => 'nullable|json',
            'response_time' => 'nullable|string|in:instant,few_hours,same_day,few_days',
            'accepts_offers' => 'nullable|boolean',
            'auto_reply_enabled' => 'nullable|boolean',
            'auto_reply_message' => 'nullable|string|max:500',
            'vacation_mode' => 'nullable|boolean',
            'vacation_message' => 'nullable|string|max:300',
            'business_description' => 'nullable|string|max:1000',
            'return_policy' => 'nullable|string|max:500',
            'shipping_info' => 'nullable|string|max:500',
            'social_facebook' => 'nullable|url|max:255',
            'social_instagram' => 'nullable|url|max:255',
            'social_tiktok' => 'nullable|url|max:255',
            'social_youtube' => 'nullable|url|max:255',
            'social_website' => 'nullable|url|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $settings = SellerSetting::firstOrCreate(['user_id' => $userId]);

        // Ažuriraj samo proslijeđene vrijednosti
        $updateData = [];

        if ($request->has('show_phone')) {
            $updateData['show_phone'] = (bool) $request->show_phone;
        }
        if ($request->has('show_email')) {
            $updateData['show_email'] = (bool) $request->show_email;
        }
        if ($request->has('show_whatsapp')) {
            $updateData['show_whatsapp'] = (bool) $request->show_whatsapp;
        }
        if ($request->has('show_viber')) {
            $updateData['show_viber'] = (bool) $request->show_viber;
        }
        if ($request->has('whatsapp_number')) {
            $updateData['whatsapp_number'] = $request->whatsapp_number;
        }
        if ($request->has('viber_number')) {
            $updateData['viber_number'] = $request->viber_number;
        }
        if ($request->has('preferred_contact_method')) {
            $updateData['preferred_contact_method'] = $request->preferred_contact_method;
        }
        if ($request->has('business_hours')) {
            $updateData['business_hours'] = $request->business_hours;
        }
        if ($request->has('response_time')) {
            $updateData['response_time'] = $request->response_time;
        }
        if ($request->has('accepts_offers')) {
            $updateData['accepts_offers'] = (bool) $request->accepts_offers;
        }
        if ($request->has('auto_reply_enabled')) {
            $updateData['auto_reply_enabled'] = (bool) $request->auto_reply_enabled;
        }
        if ($request->has('auto_reply_message')) {
            $updateData['auto_reply_message'] = $request->auto_reply_message;
        }
        if ($request->has('vacation_mode')) {
            $updateData['vacation_mode'] = (bool) $request->vacation_mode;
        }
        if ($request->has('vacation_message')) {
            $updateData['vacation_message'] = $request->vacation_message;
        }
        if ($request->has('business_description')) {
            $updateData['business_description'] = $request->business_description;
        }
        if ($request->has('return_policy')) {
            $updateData['return_policy'] = $request->return_policy;
        }
        if ($request->has('shipping_info')) {
            $updateData['shipping_info'] = $request->shipping_info;
        }
        if ($request->has('social_facebook')) {
            $updateData['social_facebook'] = $request->social_facebook;
        }
        if ($request->has('social_instagram')) {
            $updateData['social_instagram'] = $request->social_instagram;
        }
        if ($request->has('social_tiktok')) {
            $updateData['social_tiktok'] = $request->social_tiktok;
        }
        if ($request->has('social_youtube')) {
            $updateData['social_youtube'] = $request->social_youtube;
        }
        if ($request->has('social_website')) {
            $updateData['social_website'] = $request->social_website;
        }

        $settings->update($updateData);

        return response()->json([
            'error' => false,
            'message' => 'Postavke su uspješno ažurirane',
            'data' => $settings->fresh(),
        ]);
    }
}
