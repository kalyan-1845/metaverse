const axios = require('axios');

async function runStressTest(count) {
    console.log(`Starting Stress Test: ${count} requests...`);
    const promises = [];
    const messages = [
        { role: "user", content: "Who are you and what do you do?" },
        { role: "user", content: "Tell me about Murali Music background." },
        { role: "user", content: "Explain your Ollama migration expertise." },
        { role: "user", content: "Why should we hire you?" }
    ];

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < count; i++) {
        const msg = messages[i % messages.length];
        const request = axios.post('http://localhost:3000/api/chat', {
            messages: [msg]
        })
        .then(res => {
            successCount++;
            if (i % 50 === 0) console.log(`Completed ${i} requests... Status: OK`);
        })
        .catch(err => {
            failCount++;
            console.error(`Request ${i} failed. Error Code: ${err.code}`);
        });
        
        // Parallelizing but with a slight throttle to avoid local port exhaustion
        promises.push(request);
        if (promises.length >= 20) {
            await Promise.all(promises);
            promises.length = 0;
        }
    }

    await Promise.all(promises);
    console.log("\n--- STRESS TEST FINAL REPORT ---");
    console.log(`Total Requests: ${count}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log("-------------------------------\n");
}

runStressTest(400);
