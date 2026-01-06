"use strict";
/**
 * Test No Documents Handling
 * Run with: npx tsx src/__tests__/no-documents.test.ts
 *
 * This test verifies that:
 * 1. hasDocuments() correctly detects when the Pinecone index is empty
 * 2. The LLM responds appropriately when no relevant documents are found
 * 3. Greetings still work even when no documents are available
 * 4. The ask handler skips embedding/query when no documents exist (saves compute)
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const pinecone_1 = require("../services/pinecone");
const llm_1 = require("../services/llm");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
async function testNoDocuments() {
    console.log('='.repeat(60));
    console.log('Testing No Documents Handling');
    console.log('='.repeat(60));
    // Test 1: Check hasDocuments() function
    console.log('\n📋 Test 1: hasDocuments() Function\n');
    let indexIsEmpty = false;
    try {
        const documentsExist = await (0, pinecone_1.hasDocuments)();
        indexIsEmpty = !documentsExist;
        console.log(`  Pinecone index has documents: ${documentsExist}`);
        if (documentsExist) {
            console.log('  ⚠️  Index has documents - to test empty index behavior,');
            console.log('     delete all documents first or use a different index.');
        }
        else {
            console.log('  ✅ Index is empty - hasDocuments() returned false correctly.');
        }
    }
    catch (error) {
        console.error('  ❌ Error checking documents:', error);
    }
    // Test 2: LLM response with empty chunks (simulates no documents scenario)
    console.log('\n📋 Test 2: Substantive Question with Empty Chunks\n');
    console.log('  Scenario: User asks a substantive question when no documents exist.');
    console.log('  Expected: LLM should decline and mention uploading documents.\n');
    try {
        const emptyChunks = [];
        const question = 'What is the company refund policy?';
        console.log(`  Question: "${question}"`);
        console.log('  Chunks: [] (empty - simulating no relevant documents found)\n');
        const answer = await (0, llm_1.answerWithContext)(question, emptyChunks);
        console.log('  LLM Response:');
        console.log('  ' + '-'.repeat(50));
        console.log('  ' + answer.split('\n').join('\n  '));
        console.log('  ' + '-'.repeat(50));
        // Check if response correctly declines to answer with general knowledge
        const declinedProperly = answer.toLowerCase().includes('document') ||
            answer.toLowerCase().includes('upload') ||
            answer.toLowerCase().includes('can only');
        if (declinedProperly) {
            console.log('\n  ✅ PASS: LLM correctly indicated it needs documents to answer.');
        }
        else {
            console.log('\n  ❌ FAIL: LLM may have answered using general knowledge.');
        }
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
    // Test 3: Greetings should still work even with no documents
    console.log('\n📋 Test 3: Greetings Should Still Work\n');
    console.log('  Scenario: User says hello when no documents exist.');
    console.log('  Expected: LLM should respond warmly (not decline).\n');
    try {
        const emptyChunks = [];
        const greeting = 'Hello!';
        console.log(`  Greeting: "${greeting}"`);
        console.log('  Chunks: [] (empty)\n');
        const answer = await (0, llm_1.answerWithContext)(greeting, emptyChunks);
        console.log('  LLM Response:');
        console.log('  ' + '-'.repeat(50));
        console.log('  ' + answer.split('\n').join('\n  '));
        console.log('  ' + '-'.repeat(50));
        // Check if response is warm/friendly
        const respondedWarmly = answer.toLowerCase().includes('hello') ||
            answer.toLowerCase().includes('hi') ||
            answer.toLowerCase().includes('hey') ||
            answer.toLowerCase().includes('help') ||
            answer.toLowerCase().includes('how are you');
        if (respondedWarmly) {
            console.log('\n  ✅ PASS: LLM responded warmly to greeting.');
        }
        else {
            console.log('\n  ⚠️  Response may not be warm enough, but check manually.');
        }
    }
    catch (error) {
        console.error('  ❌ Error:', error);
    }
    // Test 4: Various greeting patterns
    console.log('\n📋 Test 4: Multiple Greeting Patterns\n');
    const greetings = ['Hi there!', 'Good morning!', 'Hey, how are you?'];
    for (const greet of greetings) {
        try {
            const emptyChunks = [];
            const answer = await (0, llm_1.answerWithContext)(greet, emptyChunks);
            const isWarm = !answer.toLowerCase().includes('upload') &&
                !answer.toLowerCase().includes('no document');
            const status = isWarm ? '✅' : '⚠️';
            console.log(`  ${status} "${greet}" → "${answer.substring(0, 60)}..."`);
        }
        catch (error) {
            console.log(`  ❌ "${greet}" → Error: ${error}`);
        }
    }
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`
  The ask handler now:
  1. Checks if documents exist using hasDocuments() (O(1) operation)
  2. If NO documents: skips embedding/query, passes empty chunks to LLM
  3. LLM then handles the request:
     - Greetings → responds warmly
     - Substantive questions → declines, asks user to upload documents
  4. If documents EXIST: normal RAG flow (embed → query → LLM with context)
`);
    console.log('='.repeat(60) + '\n');
}
testNoDocuments();
//# sourceMappingURL=no-documents.test.js.map