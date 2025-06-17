// --- harolds-great-escape/netlify/functions/get-data.js ---
const crypto = require('crypto');

// Re-using the same validation function for security.
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
    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { initData } = event.queryStringParameters;
    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
        return { statusCode: 500, body: 'BOT_TOKEN environment variable not set.' };
    }

    const isValid = await validate(initData, BOT_TOKEN);

    if (!isValid) {
        return { statusCode: 403, body: 'Forbidden: Invalid hash' };
    }

    const user = JSON.parse(new URLSearchParams(initData).get('user'));
    
    console.log(`Fetching data for user ${user.id}`);

    // ===================================================================
    // === DATABASE LOGIC GOES HERE ===
    // In a real application, you would fetch the user's saved data
    // from your database here.
    //
    // Example with a hypothetical DB client:
    // const playerData = await db.collection('players').findOne({ _id: user.id });
    // if (playerData) {
    //   return { statusCode: 200, body: JSON.stringify(playerData) };
    // }
    // ===================================================================

    // For now, we return default data if no user is found.
    const defaultData = {
        userId: user.id,
        firstName: user.first_name,
        coins: 0,
        kills: 0,
        message: "No saved data found, starting fresh."
    };

    return {
        statusCode: 200,
        body: JSON.stringify(defaultData),
    };
};