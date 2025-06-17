// harolds-great-escape/netlify/functions/telegram-webhook.js

const fetch = require('node-fetch');

exports.handler = async (event) => {
    // Only allow POST requests (from Telegram)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

    try {
        const body = JSON.parse(event.body);
        
        // Check if there is a message and text
        if (body.message && body.message.text) {
            const message = body.message;
            const chatId = message.chat.id;
            const text = message.text;

            // --- Your Bot's Logic Goes Here ---
            if (text === '/start') {
                const welcomeMessage = "Welcome to Harold's Great Escape! Press the 'Play Game' button below to start playing.";
                
                await fetch(`${API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: welcomeMessage,
                    }),
                });
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }

    // Return a 200 OK response to Telegram to acknowledge receipt of the update
    return {
        statusCode: 200,
        body: 'OK',
    };
};