/**
 * Test Chat History Memory
 * Run with: npx tsx src/__tests__/chat-history.test.ts
 */

import { answerWithContext } from '../services/llm';
import { Message } from '../types';
import * as dotenv from 'dotenv';
import { RetrievedChunk } from '../types';

// Load environment variables
dotenv.config();

async function testChatHistory() {
    console.log('Testing Chat History Memory...\n');

    // 1. Define a conversation history where the user states their name
    const history: Message[] = [
        { role: 'user', content: 'Hi, my name is Azeez.' },
        { role: 'assistant', content: 'Hello Azeez! How can I help you today?' }
    ];

    console.log('Context History:');
    history.forEach(m => console.log(`  ${m.role}: ${m.content}`));

    // 2. Ask a question that requires memory
    const question = 'What is my name?';
    console.log(`\nCurrent Question: "${question}"`);

    // 3. Call LLM with history but NO documents (to isolate memory)
    const emptyChunks: RetrievedChunk[] = [];

    try {
        console.log('\nAsking LLM...');
        const answer = await answerWithContext(question, emptyChunks, history);

        console.log(`\nLLM Answer: "${answer}"`);

        // 4. Verify the answer contains the name
        if (answer.toLowerCase().includes('azeez')) {
            console.log('\n✅ PASS: LLM remembered the name from history.');
        } else {
            console.log('\n❌ FAIL: LLM did not mention the name.');
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
    }
}

testChatHistory();
