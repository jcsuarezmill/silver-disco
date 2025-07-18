// File: api/telegram.js - FINAL CORRECTED VERSION

// We need to import the library first, before we use it.
const nodeFetch = require('node-fetch');

const GAME_SHORT_NAME = 'Haroldsescapebysexyboredom';

// The main function that Vercel will run
exports.handler = async (event) => {
    // This is where we get the secret token from Vercel's settings
    const botToken = process.env.Telegramapi;
    const TELEGRAM_API_URL = `https://api.telegram.org/bot${botToken}`;
    
    // We only care about POST requests from Telegram
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);

        // A. Handle a regular message like /start or /play
        if (body.message) {
            const chatId = body.message.chat.id;
            const text = body.message.text;

            if (text === '/start' || text === '/play') {
                // Now we use the imported 'nodeFetch'
                await nodeFetch(`${TELEGRAM_API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: 'Click the button below to start your escape!',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: "🚀 Play Harold's Great Escape", callback_game: {} }]
                            ]
                        }
                    })
                });
            }
        }
        // B. Handle the user pressing the "Play" button
        else if (body.callback_query && body.callback_query.game_short_name) {
            if (body.callback_query.game_short_name === GAME_SHORT_NAME) {
                // And we use 'nodeFetch' here as well
                await nodeFetch(`${TELEGRAM_API_URL}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: body.callback_query.id,
                        url: `https://hailvirgo123.itch.io/harold`
                    })
                }); // <-- THE MISSING BRACKETS HAVE BEEN ADDED HERE
            }
        }

        // Tell Telegram the request was received successfully
        return { statusCode: 200, body: 'OK' };

    } catch (e) {
        console.error("Error processing Telegram update:", e);
        return { statusCode: 200, body: 'OK' }; // Always return 200 to prevent Telegram from resending
    }
};
