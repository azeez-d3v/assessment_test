/**
 * Manual test for Azure Document Intelligence
 * Run with: npx tsx src/__tests__/azure-doc-intel.test.ts [optional-pdf-path]
 * 
 * If no PDF path is provided, it will use a minimal test PDF buffer.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import the Azure service
import { isAzureConfigured, analyzeDocumentWithAzure } from '../services/azure-doc-intel';

// Minimal valid PDF for basic testing (same as pdf-parse.test.ts)
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

async function testAzureDocIntel() {
    console.log('=== Azure Document Intelligence Manual Test ===\n');

    // Test 1: Check configuration
    console.log('Test 1: Checking Azure configuration...');
    if (!isAzureConfigured()) {
        console.error('❌ Azure Document Intelligence is NOT configured.');
        console.error('   Set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT and AZURE_DOCUMENT_INTELLIGENCE_KEY in .env');
        console.log('\n⚠️  Skipping Azure tests (no credentials)');
        console.log('   The system will fall back to Textract/pdf-parse in production.\n');
        return;
    }
    console.log('✅ Azure credentials found\n');

    // Determine which PDF to use
    const pdfPath = process.argv[2];
    let buffer: Buffer;

    if (pdfPath) {
        const absolutePath = path.resolve(pdfPath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`❌ File not found: ${absolutePath}`);
            process.exit(1);
        }
        console.log(`Test 2: Reading PDF file: ${absolutePath}`);
        buffer = fs.readFileSync(absolutePath);
        console.log(`   File size: ${(buffer.length / 1024).toFixed(2)} KB\n`);
    } else {
        console.log('Test 2: Using minimal test PDF buffer...');
        buffer = minimalPDF;
        console.log(`   Buffer size: ${buffer.length} bytes\n`);
    }

    // Test 3: Analyze document
    console.log('Test 3: Sending to Azure Document Intelligence...');
    console.log('   (This may take 10-60 seconds)\n');

    const startTime = Date.now();
    try {
        const markdown = await analyzeDocumentWithAzure(buffer);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Analysis complete in ${elapsed}s\n`);

        // Show preview of content
        console.log('=== EXTRACTED MARKDOWN (preview) ===\n');
        const preview = markdown.substring(0, 500);
        console.log(preview);
        if (markdown.length > 500) {
            console.log(`\n... (${markdown.length - 500} more characters)`);
        }
        console.log('\n=== END OF PREVIEW ===\n');

        // Summary
        console.log('📊 Summary:');
        console.log(`   - Total characters: ${markdown.length}`);
        console.log(`   - Processing time: ${elapsed}s`);
        console.log(`   - Contains markdown headers: ${markdown.includes('#') ? 'Yes' : 'No'}`);
        console.log(`   - Contains tables: ${markdown.includes('|') ? 'Yes' : 'No'}`);

        console.log('\n🎉 Azure Document Intelligence test passed!');
        console.log('   Ready for deployment.\n');

    } catch (error) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
        console.error(`\n❌ Azure analysis failed after ${elapsed}s`);
        console.error('Error:', error);
        process.exit(1);
    }
}

testAzureDocIntel().catch(console.error);
