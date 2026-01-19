<?php

namespace App\Http\Controllers;

use App\Models\ItemOffer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ItemConversationController extends Controller
{
    /**
     * Provjeri da li postoji konverzacija za ovaj oglas
     */
    public function checkConversation(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'item_id' => 'required|exists:items,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => true,
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $userId = Auth::id();
        $itemId = $request->item_id;

        // Pronađi postojeću konverzaciju
        $conversation = ItemOffer::where('item_id', $itemId)
            ->where('buyer_id', $userId)
            ->with(['item:id,name,image', 'seller:id,name,profile'])
            ->first();

        if (!$conversation) {
            return response()->json([
                'error' => true,
                'message' => 'Nema postojeće konverzacije',
                'data' => null,
            ]);
        }

        // Izračunaj broj nepročitanih poruka
        $unreadCount = $conversation->chats()
            ->where('sender_id', '!=', $userId)
            ->where('status', '!=', 'seen')
            ->count();

        return response()->json([
            'error' => false,
            'message' => 'Konverzacija pronađena',
            'data' => [
                'id' => $conversation->id,
                'item' => $conversation->item,
                'seller' => $conversation->seller,
                'unread_count' => $unreadCount,
                'last_message' => $conversation->last_message,
                'last_message_at' => $conversation->updated_at,
            ],
        ]);
    }
}
