const axios = require('axios');
require('dotenv').config();

const key = process.env.GROQ_API_KEY;
console.log('Key exists:', !!key);
if (key) {
    console.log('Key Prefix:', key.substring(0, 10));
}

async function test() {
    try {
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        const response = await axios.post(url, {
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'Write a short question about gravity.' }]
        }, {
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('SUCCESS:', JSON.stringify(response.data.choices[0].message.content, null, 2));
    } catch (e) {
        console.log('FAILED:', e.message);
        if (e.response) {
            console.log('STATUS:', e.response.status);
            console.log('ERROR:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

test();
