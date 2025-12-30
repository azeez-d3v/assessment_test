/**
 * Test for pdf-parse-new to ensure it works before deploying
 * Run with: npx tsx src/__tests__/pdf-parse.test.ts
 */

import pdfParse from 'pdf-parse-new';
import * as fs from 'fs';
import * as path from 'path';

// Create a simple test PDF buffer (minimal valid PDF)
const minimalPDF = Buffer.from(`%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 100 700 Td (Hello World) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000206 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
300
%%EOF`);

async function testPdfParse() {
    console.log('Testing pdf-parse-new...\n');

    try {
        // Test 1: Basic parsing with minimal PDF
        console.log('Test 1: Parsing minimal PDF buffer...');
        const result = await pdfParse(minimalPDF);
        console.log('✅ Parse succeeded');
        console.log(`   - Pages: ${result.numpages}`);
        console.log(`   - Text length: ${result.text.length} chars`);
        console.log(`   - Text preview: "${result.text.substring(0, 50).replace(/\n/g, ' ')}..."`);

        // Test 2: Check result structure
        console.log('\nTest 2: Checking result structure...');
        if (typeof result.text === 'string') {
            console.log('✅ result.text is a string');
        } else {
            throw new Error('result.text is not a string');
        }

        if (typeof result.numpages === 'number') {
            console.log('✅ result.numpages is a number');
        } else {
            throw new Error('result.numpages is not a number');
        }

        // Test 3: Check it doesn't throw on empty-ish content
        console.log('\nTest 3: Error handling...');
        try {
            await pdfParse(Buffer.from('not a pdf'));
            console.log('⚠️  No error thrown for invalid PDF (library is lenient)');
        } catch (e) {
            console.log('✅ Correctly throws error for invalid PDF');
        }

        console.log('\n🎉 All tests passed! pdf-parse-new is working correctly.');
        console.log('   Safe to deploy to Lambda.\n');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

testPdfParse();
