import OpenAI from "openai";
import 'dotenv/config';
import {
    parseVTT,
    parseHTML,
    chunkVideoTranscript,
    chunkArticleText,
    streamToString,
} from "./contentProcessor.js";
import Lecture from "../../models/lecture.js";
import { s3Client } from "../../controllers/uploadController.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Tạo embeddings cho một batch texts
 */
async function createEmbeddings(texts, batchSize = 100) {
    
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch,
            });

            const embeddings = response.data.map((item) => item.embedding);
            allEmbeddings.push(...embeddings);

            console.log(`Created embeddings for ${i + batch.length}/${texts.length} chunks`);

            // Rate limiting: delay để tránh vượt quá giới hạn API
            if (i + batchSize < texts.length) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        } catch (error) {
            console.error(`Error creating embeddings for batch ${i}-${i + batch.length}:`, error);
            throw error;
        }
    }

    return allEmbeddings;
}

/**
 * Process VIDEO lecture và tạo embeddings
 */
async function processVideoLecture(lectureId) {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) throw new Error("Lecture not found");
        if (lecture.type !== "video") throw new Error("Lecture is not a video");

        // Tìm caption phù hợp (ưu tiên Vietnamese, fallback sang English)
        const preferredLanguages = ["vi", "en"];
        let selectedCaption = null;

        for (const lang of preferredLanguages) {
            selectedCaption = lecture.content.captions.find((c) => c.language === lang);
            if (selectedCaption) break;
        }

        if (!selectedCaption) {
            throw new Error("No suitable caption found for this video");
        }

        console.log(`Processing video lecture: ${lecture.title}`);
        console.log(`Using caption: ${selectedCaption.language}`);

        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: selectedCaption.s3Key,
        });

        const response = await s3Client.send(command);
        const vttContent = await streamToString(response.Body);

        const cues = parseVTT(vttContent);
        console.log(`Parsed ${cues.length} VTT cues`);

        // 2. Chunk transcript
        const chunks = chunkVideoTranscript(cues, 150, 30);
        console.log(`Created ${chunks.length} chunks`);

        // 3. Tạo embeddings
        const texts = chunks.map((chunk) => chunk.text);
        const embeddings = await createEmbeddings(texts);

        // 4. Lưu vào database
        lecture.chunks = chunks.map((chunk, index) => ({
            text: chunk.text,
            chunkIndex: index,
            embedding: embeddings[index],
            metadata: {
                startTime: chunk.startTime,
                endTime: chunk.endTime,
                language: selectedCaption.language,
            },
        }));

        lecture.embeddingMetadata = {
            isIndexed: true,
            totalChunks: chunks.length,
            embeddingModel: "text-embedding-3-small",
            lastIndexedAt: new Date(),
            sourceLanguage: selectedCaption.language,
        };

        await lecture.save();

        console.log(`Successfully indexed video lecture: ${lectureId}`);
        return lecture;
    } catch (error) {
        console.error("Error processing video lecture:", error);
        throw error;
    }
}

async function processArticleLecture(lectureId) {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) throw new Error("Lecture not found");
        if (lecture.type !== "article") throw new Error("Lecture is not an article");
        if (!lecture.content.text) throw new Error("Article has no text content");

        console.log(`Processing article lecture: ${lecture.title}`);

        // 1. Parse HTML thành plain text
        const plainText = parseHTML(lecture.content.text);
        console.log(`Extracted ${plainText.length} characters of text`);

        // 2. Chunk text
        const chunks = chunkArticleText(plainText, 150, 30);
        console.log(`Created ${chunks.length} chunks`);

        // 3. Tạo embeddings
        const texts = chunks.map((chunk) => chunk.text);
        const embeddings = await createEmbeddings(texts);

        // 4. Lưu vào database
        lecture.chunks = chunks.map((chunk, index) => ({
            text: chunk.text,
            chunkIndex: index,
            embedding: embeddings[index],
            metadata: {},
        }));

        lecture.embeddingMetadata = {
            isIndexed: true,
            totalChunks: chunks.length,
            embeddingModel: "text-embedding-3-small",
            lastIndexedAt: new Date(),
            sourceLanguage: "vi", // Giả sử article là tiếng Việt
        };

        await lecture.save();

        console.log(`Successfully indexed article lecture: ${lectureId}`);
        return lecture;
    } catch (error) {
        console.error("Error processing article lecture:", error);
        throw error;
    }
}


async function indexLecture(lectureId) {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) throw new Error("Lecture not found");

        if (lecture.type === "video") {
            return await processVideoLecture(lectureId);
        } else if (lecture.type === "article") {
            return await processArticleLecture(lectureId);
        } else {
            throw new Error(`Unsupported lecture type: ${lecture.type}`);
        }
    } catch (error) {
        console.error("Error indexing lecture:", error);
        throw error;
    }
}


async function reindexLecture(lectureId) {
    try {
        const lecture = await Lecture.findById(lectureId);
        if (!lecture) throw new Error("Lecture not found");

        // Xóa chunks cũ
        lecture.chunks = [];
        lecture.embeddingMetadata.isIndexed = false;
        await lecture.save();

        // Index lại
        return await indexLecture(lectureId);
    } catch (error) {
        console.error("Error reindexing lecture:", error);
        throw error;
    }
}

export {
    indexLecture
}
