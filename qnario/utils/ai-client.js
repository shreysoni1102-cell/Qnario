/**
 * AI Microservice Client
 * Communicates with Python Groq question generator microservice
 */

const axios = require('axios');

const AI_MICROSERVICE_URL = process.env.AI_MICROSERVICE_URL || 'http://localhost:5000';

class AIClient {
    static async healthCheck() {
        try {
            const response = await axios.get(`${AI_MICROSERVICE_URL}/health`, {
                timeout: 5000
            });
            return response.data.status === 'healthy';
        } catch (error) {
            console.error('AI microservice health check failed:', error.message);
            return false;
        }
    }

    static async generateQuestions(options) {
        try {
            const {
                subject,
                topic,
                difficulty,
                count = 5,
                question_type = 'MCQ',
                level,
                stream,
                specific_topics,
                marks = 1
            } = options;

            if (!topic) {
                throw new Error('Missing required field: topic');
            }

            const payload = {
                subject: subject || 'General',
                topic,
                difficulty: difficulty || 'Medium',
                count: Math.min(count, 50),
                question_type: question_type || 'MCQ',
                level,
                stream,
                specific_topics,
                marks
            };

            const response = await axios.post(
                `${AI_MICROSERVICE_URL}/api/generate-questions`,
                payload,
                { timeout: 60000 }
            );

            if (response.data.success) {
                return {
                    success: true,
                    questions: response.data.questions,
                    count: response.data.count,
                    source: response.data.source
                };
            }
            return {
                success: false,
                error: response.data.error,
                questions: []
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                questions: []
            };
        }
    }

    static async testConnection() {
        try {
            const response = await axios.get(`${AI_MICROSERVICE_URL}/api/test-groq`, {
                timeout: 15000
            });
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = AIClient;
