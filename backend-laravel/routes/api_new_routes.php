<?php

/**
 * NOVE RUTE ZA DODATI U routes/api.php
 *
 * Kopirajte ove rute u vaš postojeći api.php fajl
 * unutar middleware grupe 'auth:sanctum' ili slične
 */

use App\Http\Controllers\ItemQuestionController;
use App\Http\Controllers\SellerSettingsController;
use App\Http\Controllers\ItemConversationController;

// ============================================
// JAVNA PITANJA NA OGLASIMA
// ============================================

// Dohvati pitanja (može i bez auth)
Route::get('item-questions', [ItemQuestionController::class, 'getQuestions']);

// Zaštićene rute (zahtijevaju auth)
Route::middleware('auth:sanctum')->group(function () {

    // Pitanja
    Route::post('add-question', [ItemQuestionController::class, 'addQuestion']);
    Route::post('answer-question', [ItemQuestionController::class, 'answerQuestion']);
    Route::post('like-question', [ItemQuestionController::class, 'likeQuestion']);
    Route::post('delete-question', [ItemQuestionController::class, 'deleteQuestion']);
    Route::post('report-question', [ItemQuestionController::class, 'reportQuestion']);

    // Provjera konverzacije
    Route::get('check-item-conversation', [ItemConversationController::class, 'checkConversation']);

    // Seller Settings
    Route::get('get-seller-settings', [SellerSettingsController::class, 'getSettings']);
    Route::post('update-seller-settings', [SellerSettingsController::class, 'updateSettings']);
});


/**
 * ============================================
 * UPUTSTVO ZA INTEGRACIJU
 * ============================================
 *
 * 1. Pokrenite migracije:
 *    php artisan migrate
 *
 * 2. Dodajte ove rute u routes/api.php
 *
 * 3. Registrirajte modele u config/app.php ako je potrebno
 *
 * 4. Testirajte API endpointe:
 *    - GET  /api/item-questions?item_id=1
 *    - POST /api/add-question (item_id, question)
 *    - POST /api/answer-question (question_id, answer)
 *    - POST /api/like-question (question_id)
 *    - POST /api/delete-question (question_id)
 *    - POST /api/report-question (question_id, reason)
 *    - GET  /api/check-item-conversation?item_id=1
 *    - GET  /api/get-seller-settings
 *    - POST /api/update-seller-settings (...)
 */
