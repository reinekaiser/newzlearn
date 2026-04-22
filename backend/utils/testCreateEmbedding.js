import Lecture from "../models/lecture.js";
import dotenv from 'dotenv';
import { indexLecture } from "./createEmbeddings.js";
import mongoose from "mongoose";
import Course from "../models/course.js";

dotenv.config();

async function testIndexing() {
    try {

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
                    dbName: "elearning"
                });
        console.log('✓ Connected to MongoDB');

        const lectureId = "6937c77a9cf791c389292302"; 
        
        if (!lectureId) {
            console.error('❌ Please provide lectureId as argument');
            console.log('Usage: node testIndexLecture.js <lectureId>');
            process.exit(1);
        }

        console.log('\n📝 Starting indexing process...\n');
        const startTime = Date.now();
        
        const indexedLecture = await indexLecture(lectureId);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        
        console.log('\n✅ Indexing completed successfully!');
        console.log(`\n📊 Results:`);
        console.log(`  - Total chunks: ${indexedLecture.embeddingMetadata.totalChunks}`);
        console.log(`  - Embedding model: ${indexedLecture.embeddingMetadata.embeddingModel}`);
        console.log(`  - Source language: ${indexedLecture.embeddingMetadata.sourceLanguage}`);
        console.log(`  - Duration: ${duration}s`);
        
        console.log('\n📝 Sample chunks:');
        indexedLecture.chunks.slice(0, 3).forEach((chunk, idx) => {
            console.log(`\nChunk ${idx + 1}:`);
            console.log(`  Text: ${chunk.text.substring(0, 100)}...`);
            console.log(`  Embedding dimensions: ${chunk.embedding.length}`);
            if (chunk.metadata.startTime !== undefined) {
                console.log(`  Time: ${chunk.metadata.startTime.toFixed(2)}s - ${chunk.metadata.endTime.toFixed(2)}s`);
            }
        });
        
    } catch (error) {
        console.error('\n❌ Error during indexing:');
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ MongoDB connection closed');
    }
}

// Run test
testIndexing();