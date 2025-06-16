// File: netlify/functions/telegram.js - FINAL, DYNAMIC VERSION

// Use a more reliable way to make requests from a server environment
const fetch = require('node-fetch');

const GAME_SHORT_NAME = 'Haroldsescapebysexyboredom';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.Telegramapi}`; // Uses your custom key

// Main function that Netlify will run
exports.handler = async (event) => {
    // Check if the request is coming from Telegram
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
                await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body