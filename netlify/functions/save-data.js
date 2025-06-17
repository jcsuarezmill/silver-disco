// --- harolds-great-escape/netlify/functions/save-data.js ---
const crypto = require('crypto');

// This function validates the data received from the Telegram Mini App.
// It's a crucial security measure to prevent cheating.
async function validate(initData, botToken) {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return calculatedHash === hash;
}

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { initData, coins, kills } = JSON.parse(event.body);
    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
        return { statusCode: 500, body: 'BOT_TOKEN environment variable not set.' };
    }

    const isValid = await validate(initData, BOT_TOKEN);

    if (!isValid) {
        return { statusCode: 403, body: 'Forbidden: Invalid hash' };
    }

    // Data is valid, proceed to save it.
    // The user ID can be safely extracted after validation.
    const user = JSON.parse(new URLSearchParams(initData).get('user'));

    console.log(`Saving data for user ${user.id}: Coins - ${coins}, Kills - ${kills}`);

    // ===================================================================
    // === DATABASE LOGIC GOES HERE ===
    // In a real application, you would connect to a database (like
    // FaunaDB, Supabase, MongoDB Atlas, etc.) and save the user's data.
    //
    // Example with a hypothetical DB client:
    // await db.collection('players').updateOne(
    //   { _id: user.id },
    //   { $set: { firstName: user.first_name, coins: coins, kills: kills } },
    //   { upsert: true }
    // );
    // ===================================================================

    return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Data saved successfully', userId: user.id }),
    };
};