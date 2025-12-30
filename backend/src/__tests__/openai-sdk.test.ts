/**
 * Test OpenAI SDK with OpenRouter integration
 * Run with: npx tsx src/__tests__/openai-sdk.test.ts
 */

import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY not found in environment');
    console.log('   Set it in your .env file or environment');
    process.exit(1);
}

async function testOpenAISDK() {
    console.log('Testing OpenAI SDK with OpenRouter...\n');

    const openai = new OpenAI({
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: OPENROUTER_API_KEY,
    });

    // Test 1: Chat completion
    console.log('Test 1: Chat completion with gpt-4o-mini...');
    try {
        const completion = await openai.chat.completions.create({
            model: 'openai/gpt-4o-mini',
            messages: [
                { role: 'user', content: 'Say "Hello from OpenRouter!" in exactly 5 words.' }
            ],
            max_tokens: 50,
        });

        const response = completion.choices?.[0]?.message?.content;
        console.log(`✅ Response: "${response}"`);
        console.log(`   Model: ${completion.model}`);
        console.log(`   Tokens: ${completion.usage?.total_tokens}`);
    } catch (error) {
        console.error('❌ Chat completion failed:', error);
        process.exit(1);
    }

    // Test 2: Embeddings
    console.log('\nTest 2: Embeddings with text-embedding-3-small...');
    try {
        const embedding = await openai.embeddings.create({
            model: 'openai/text-embedding-3-small',
            input: 'This is a test sentence for embedding.',
        });

        const vector = embedding.data?.[0]?.embedding;
        console.log(`✅ Embedding generated`);
        console.log(`   Dimensions: ${vector?.length}`);
        console.log(`   First 5 values: [${vector?.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    } catch (error) {
        console.error('❌ Embeddings failed:', error);
        process.exit(1);
    }

    console.log('\n🎉 All tests passed! OpenAI SDK + OpenRouter is working correctly.');
    console.log('   Safe to deploy.\n');
}

testOpenAISDK();
