// Test script to check if the external API supports streaming
// Using built-in fetch (Node.js 18+)

async function testStreaming() {
  console.log('Testing streaming with external API...');

  // Disable SSL verification for testing
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

  const response = await fetch('https://api.shekharcharles.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer sk-V0uLRjl10b4xUvoXOEHggQ',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      messages: [
        { role: 'user', content: 'Hello, please write a short story about a cat.' }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 100,
    }),
  });

  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  console.log('Content-Type:', response.headers.get('content-type'));
  
  if (response.body) {
    console.log('Response body exists, checking if it streams...');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunkCount = 0;
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream ended. Total chunks received:', chunkCount);
          break;
        }
        
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`Chunk ${chunkCount}:`, chunk.substring(0, 100) + (chunk.length > 100 ? '...' : ''));
        
        if (chunkCount >= 5) {
          console.log('Stopping after 5 chunks for testing...');
          break;
        }
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    console.log('No response body found');
  }
}

testStreaming().catch(console.error);
