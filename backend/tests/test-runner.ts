/**
 * Local test runner for Lambda handlers
 * Usage: npx ts-node tests/test-runner.ts
 */

import { handler as ingestHandler } from '../src/handlers/ingest';
import { handler as askHandler } from '../src/handlers/ask';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Load environment variables from .env file
import { config } from 'dotenv';
config();

/**
 * Create a mock API Gateway event
 */
function createMockEvent(body: object): APIGatewayProxyEvent {
    return {
        body: JSON.stringify(body),
        headers: {},
        multiValueHeaders: {},
        httpMethod: 'POST',
        isBase64Encoded: false,
        path: '/test',
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: {} as APIGatewayProxyEvent['requestContext'],
        resource: '',
    };
}

async function testIngest() {
    console.log('\n=== Testing /ingest ===\n');

    const event = createMockEvent({
        documents: [
            {
                id: 'refund-policy',
                title: 'Refund Policy',
                content: `
          Full refund within 30 days with receipt. No refunds on digital goods.
          For physical items, products must be returned in original packaging.
          Opened software and digital downloads are not eligible for refunds.
          Gift cards are non-refundable. Store credit may be issued for items
          returned after the 30-day window at management discretion.
        `.trim(),
            },
            {
                id: 'shipping-policy',
                title: 'Shipping Policy',
                content: `
          Standard shipping takes 5-7 business days. Express shipping is 2-3 days.
          Free shipping on orders over $50. International shipping available.
          Tracking numbers provided for all orders via email.
        `.trim(),
            },
        ],
    });

    const response = await ingestHandler(event);
    console.log('Status:', response.statusCode);
    console.log('Response:', JSON.parse(response.body));
}

async function testAsk() {
    console.log('\n=== Testing /ask ===\n');

    const questions = [
        'Can I get a refund on a digital product?',
        'How long does shipping take?',
        'What is the return policy for opened software?',
    ];

    for (const question of questions) {
        console.log(`\nQ: ${question}`);

        const event = createMockEvent({
            question,
            topK: 3,
        });

        const response = await askHandler(event);
        const body = JSON.parse(response.body);

        console.log(`A: ${body.answer}`);
        console.log(`Sources: ${body.sources?.map((s: { title: string }) => s.title).join(', ') || 'None'}`);
    }
}

async function main() {
    console.log('Doc Q&A Backend - Local Test Runner');
    console.log('====================================');

    // Check for required env vars
    const requiredVars = ['GEMINI_API_KEY', 'PINECONE_API_KEY', 'PINECONE_INDEX'];
    const missing = requiredVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
        console.error(`\nMissing environment variables: ${missing.join(', ')}`);
        console.error('Copy .env.example to .env and fill in your API keys.');
        process.exit(1);
    }

    try {
        await testIngest();

        // Wait a moment for Pinecone to index
        console.log('\nWaiting 3s for Pinecone indexing...');
        await new Promise(resolve => setTimeout(resolve, 3000));

        await testAsk();

        console.log('\n✅ All tests completed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

main();
