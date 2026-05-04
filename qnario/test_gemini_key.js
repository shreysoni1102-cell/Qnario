const axios = require('axios');
require('dotenv').config();

async function testGroqAPI() {
    try {
        console.log('🔍 Testing Groq API key...');
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: 'Say hello in one word.' }]
            },
            {
                timeout: 10000,
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        const reply = response.data?.choices?.[0]?.message?.content || '';
        console.log('✅ Groq API is working!');
        console.log('Response:', reply.trim());

    } catch (error) {
        console.log('❌ Groq API test failed:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
    }
}

testGroqAPI();