const axios = require('axios');
require('dotenv').config();

async function test(model) {
    try {
        const res = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model,
                messages: [{ role: 'user', content: 'hi' }]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`[${model}] Success:`, res.status);
    } catch(e) {
        console.log(`[${model}] Error:`, e.response?.status, e.response?.data?.error?.message || e.message);
    }
}

async function run() {
    await test('llama-3.1-8b-instant');
    await test('mixtral-8x7b-32768');
}
run();
