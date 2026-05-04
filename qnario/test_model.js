const axios = require('axios');
require('dotenv').config();

const key = process.env.GROQ_API_KEY;
const model = 'llama-3.1-8b-instant';

async function test() {
    try {
        console.log(`Testing model: ${model}`);
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const response = await axios.post(url, {
            model,
            messages: [{ role: 'user', content: 'Hello' }]
        }, {
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('SUCCESS');
    } catch (e) {
        console.log('STATUS:', e.response ? e.response.status : 'No response');
        if (e.response) {
            console.log('ERROR:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
