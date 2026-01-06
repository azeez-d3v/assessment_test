"use strict";
/**
 * Test Chat History Memory
 * Run with: npx tsx src/__tests__/chat-history.test.ts
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
const llm_1 = require("../services/llm");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
async function testChatHistory() {
    console.log('Testing Chat History Memory...\n');
    // 1. Define a conversation history where the user states their name
    const history = [
        { role: 'user', content: 'Hi, my name is Azeez.' },
        { role: 'assistant', content: 'Hello Azeez! How can I help you today?' }
    ];
    console.log('Context History:');
    history.forEach(m => console.log(`  ${m.role}: ${m.content}`));
    // 2. Ask a question that requires memory
    const question = 'What is my name?';
    console.log(`\nCurrent Question: "${question}"`);
    // 3. Call LLM with history but NO documents (to isolate memory)
    const emptyChunks = [];
    try {
        console.log('\nAsking LLM...');
        const answer = await (0, llm_1.answerWithContext)(question, emptyChunks, history);
        console.log(`\nLLM Answer: "${answer}"`);
        // 4. Verify the answer contains the name
        if (answer.toLowerCase().includes('azeez')) {
            console.log('\n✅ PASS: LLM remembered the name from history.');
        }
        else {
            console.log('\n❌ FAIL: LLM did not mention the name.');
        }
    }
    catch (error) {
        console.error('\n❌ Error:', error);
    }
}
testChatHistory();
//# sourceMappingURL=chat-history.test.js.map