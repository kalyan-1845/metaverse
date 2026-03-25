const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Enhanced Logging Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

const SYSTEM_PROMPT = `You are the AI representation of Kalyan, a creative developer and product thinker. 
Key projects: Murali Music (Web Audio API), Local AI Migration (Ollama).
Persona: Professional, innovative, and direct. 
CRITICAL: Keep responses extremely concise (max 2-3 sentences). Do not repeat your introductory pitch in every message. Answer ONLY the user's specific query.`;

function getMockResponse(messages) {
    if (!messages || messages.length === 0) return "Connection active. I am the AI representation of Kalyan. How can I help?";
    const lastUserMsg = messages[messages.length - 1].content.toLowerCase();
    
    const responses = {
        "why hire you": "I combine technical execution with product thinking. I don't just build features — I build memorable experiences. Ask about Murali Music or localized AI.",
        "murali": "Murali Music pushed the limits of the Web Audio API, focusing on stability and professional-grade performance.",
        "ollama": "I specialize in migrating systems to local AI using Ollama for privacy, speed, and cost-efficiency.",
        "impact": "Every project here is about impact. I optimized the 3D pipeline by 40% and built real-time AI systems.",
        "hello": "Hello! I am Kalyan's AI twin. Ready to explore?",
        "default": "I am the AI representation of the creator. Ask me about Murali Music or local AI migration."
    };

    for (const key in responses) {
        if (lastUserMsg.includes(key)) return responses[key];
    }
    return responses["default"];
}

async function callOllama(messages) {
    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
                stream: false
            })
        });
        if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error("Ollama Fallback Failed:", error.message);
        throw error;
    }
}

app.post('/api/chat', async (req, res) => {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Expected an array of messages.' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'YOUR_DEEPSEEK_API_KEY';

    // Circuit Breaker: Skip DeepSeek for 30s if it last failed
    const lastFailureTime = global.deepSeekLastFailure || 0;
    const isCircuitOpen = (Date.now() - lastFailureTime) < 30000;

    // 1. Try DeepSeek (if key valid and circuit is closed)
    if (hasValidKey && !isCircuitOpen) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // Fail fast in 2s

            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
                    temperature: 0.7,
                    max_tokens: 150 // Shorter responses are faster
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                return res.json({ response: data.choices[0].message.content });
            }
            
            console.warn("DeepSeek API error. Opening circuit breaker.");
            global.deepSeekLastFailure = Date.now();
        } catch (error) {
            console.error("DeepSeek Timeout/Error. Opening circuit breaker.");
            global.deepSeekLastFailure = Date.now();
        }
    } else if (isCircuitOpen) {
        console.log("DeepSeek Circuit is OPEN. Skipping to local fallback.");
    }


    // 2. Try Ollama (Local Fallback)
    try {
        const ollamaResponse = await callOllama(messages);
        return res.json({ response: ollamaResponse });
    } catch (error) {
        // 3. Final Mock Fallback
        console.error("All AI providers failed. Using static mock.");
        return res.json({ 
            response: getMockResponse(messages),
            isMock: true
        });
    }
});

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`>>> Metaverse AI Server listening on PORT ${PORT}`);
    console.log(`>>> Simulated mode: ${!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY'}`);
});
