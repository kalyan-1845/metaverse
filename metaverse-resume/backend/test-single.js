const axios = require('axios');

async function testSingle() {
    try {
        console.log("Testing single request to Metaverse AI Server...");
        const res = await axios.post('http://localhost:3000/api/chat', {
            messages: [{ role: "user", content: "Why should we hire you?" }]
        });
        console.log("Response Received:", res.data.response);
        console.log("TEST SUCCESSFUL");
    } catch (err) {
        console.error("TEST FAILED:", err.message);
        if (err.response) console.error("Server Status:", err.response.status, err.response.data);
    }
}

testSingle();
