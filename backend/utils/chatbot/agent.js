
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import mongoose from "mongoose";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage } from "@langchain/core/messages";
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import Lecture from "../../models/lecture.js";

/**
 * Tool để tìm kiếm thông tin trong lecture
 */
const lectureLookupTool = tool(
    async ({ lectureId, query, limit = 5 }) => {
        console.log(`[LectureLookup] Searching in lecture ${lectureId} for: "${query}"`);
        
        try {
            const vectorStore = new MongoDBAtlasVectorSearch(
                new OpenAIEmbeddings({
                    modelName: "text-embedding-3-small",
                }),
                {
                    collection: mongoose.connection.db.collection("lectures"),
                    indexName: "vector_index", // Tên index bạn đã tạo trên Atlas
                    textKey: "chunks.text",
                    embeddingKey: "chunks.embedding",
                }
            );

            const results = await vectorStore.similaritySearchWithScore(
                query,
                limit,
                {
                    preFilter: {
                        _id: { $eq: new mongoose.Types.ObjectId(lectureId) }
                    }
                }
            );

            console.log(`[LectureLookup] Found ${results.length} relevant chunks`);

            // Format kết quả
            const formattedResults = results.map(([doc, score]) => ({
                text: doc.pageContent,
                score: score,
                metadata: doc.metadata,
            }));

            console.log(formattedResults)

            return JSON.stringify(formattedResults, null, 2);
            
        } catch (error) {
            console.error('[LectureLookup] Error:', error);
            throw error;
        }
    },
    {
        name: "lecture_lookup",
        description: "Tìm kiếm thông tin liên quan trong nội dung bài giảng. Sử dụng tool này khi cần trả lời câu hỏi về nội dung cụ thể trong bài giảng.",
        schema: z.object({
            lectureId: z.string().describe("ID của bài giảng cần tìm kiếm"),
            query: z.string().describe("Câu hỏi hoặc từ khóa cần tìm kiếm"),
            limit: z.number().optional().default(5).describe("Số lượng kết quả trả về (mặc định 5)"),
        }),
    }
);

/**
 * Tool để lấy thông tin tổng quan về lecture
 */
// const lectureInfoTool = tool(
//     async ({ lectureId }) => {
//         console.log(`[LectureInfo] Getting info for lecture ${lectureId}`);
        
//         try {
//             const lecture = await Lecture.findById(lectureId)
//                 .select('title description type content.duration embeddingMetadata')
//                 .lean();

//             if (!lecture) {
//                 return JSON.stringify({ error: "Lecture not found" });
//             }

//             const info = {
//                 title: lecture.title,
//                 description: lecture.description,
//                 type: lecture.type,
//                 duration: lecture.content?.duration,
//                 isIndexed: lecture.embeddingMetadata?.isIndexed || false,
//                 totalChunks: lecture.embeddingMetadata?.totalChunks || 0,
//                 sourceLanguage: lecture.embeddingMetadata?.sourceLanguage,
//             };

//             console.log(`[LectureInfo] Lecture: ${lecture.title}, Type: ${lecture.type}`);

//             return JSON.stringify(info, null, 2);
            
//         } catch (error) {
//             console.error('[LectureInfo] Error:', error);
//             throw error;
//         }
//     },
//     {
//         name: "lecture_info",
//         description: "Lấy thông tin tổng quan về bài giảng (tiêu đề, mô tả, thời lượng, v.v.). Sử dụng tool này khi người dùng hỏi về thông tin chung của bài giảng.",
//         schema: z.object({
//             lectureId: z.string().describe("ID của bài giảng"),
//         }),
//     }
// );

/**
 * Main Agent function
 */
export async function lectureChatAgent(lectureId, query, threadId = null) {
    if (!threadId) {
        threadId = `${lectureId}_${Date.now()}`;
    }

    const GraphState = Annotation.Root({
        messages: Annotation({
            reducer: (left, right) => {
                return Array.isArray(right) ? left.concat(right) : left.concat([right]);
            },
            default: () => [],
        }),
        lectureId: Annotation({
            reducer: (left, right) => right ?? left,
            default: () => lectureId,
        }),
    });

    // ========== Setup Tools ==========
    const tools = [lectureLookupTool];
    const toolNode = new ToolNode(tools);

    // ========== Setup Model ==========
    const model = new ChatOpenAI({ 
        model: "gpt-4o",
        temperature: 0.7,
    }).bindTools(tools);

    // ========== Decision Function ==========
    function shouldContinue(state) {
        const lastMessage = state.messages[state.messages.length - 1];
        
        // Nếu có tool_calls → gọi tools
        if (lastMessage.tool_calls?.length) {
            console.log(`[Agent] Calling tools: ${lastMessage.tool_calls.map(tc => tc.name).join(', ')}`);
            return "tools";
        }
        
        // Nếu không → kết thúc
        console.log('[Agent] No tool calls, ending');
        return "__end__";
    }

    // ========== Call Model Function ==========
    async function callModel(state) {
        const lecture = await Lecture.findById(state.lectureId)
            .select('title type description')
            .lean();

        const systemPrompt = `Bạn là trợ lý AI thông minh hỗ trợ học tập cho bài giảng "${lecture.title}".

THÔNG TIN BÀI GIẢNG:
- ID: ${lecture._id}
- Tiêu đề: ${lecture.title}
- Loại: ${lecture.type === 'video' ? 'Video bài giảng' : 'Bài viết'}
${lecture.description ? `- Mô tả: ${lecture.description}` : ''}

CÔNG CỤ BẠN CÓ:
1. **lecture_lookup**: Tìm kiếm nội dung cụ thể trong bài giảng
   - Sử dụng khi cần trả lời câu hỏi về nội dung chi tiết
   - Ví dụ: "Bài giảng nói gì về X?", "Giải thích khái niệm Y"
   

NGUYÊN TẮC:
1. **Sử dụng tools** để tìm thông tin chính xác từ bài giảng
2. **Không tự bịa đặt** thông tin không có trong kết quả tool
3. Trả lời bằng **tiếng Việt**, rõ ràng và dễ hiểu
4. Nếu tool không tìm thấy thông tin → thừa nhận thẳng thắn
5. Với video lectures → đề cập timestamp khi có thể
6. Khuyến khích học viên hỏi thêm nếu chưa rõ

CÁCH TRẢ LỜI:
- Ngắn gọn, súc tích (100-200 từ)
- Đưa ra ví dụ minh họa nếu cần
- Kết thúc bằng câu hỏi để khuyến khích tương tác (optional)`;

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemPrompt],
            new MessagesPlaceholder("messages"),
        ]);

        const formatted = await prompt.formatMessages({
            messages: state.messages,
        });

        console.log('[Agent] Calling GPT-4...');
        const result = await model.invoke(formatted);
        
        return { messages: [result] };
    }

    // ========== Create Workflow ==========
    const workflow = new StateGraph(GraphState)
        .addNode("agent", callModel)
        .addNode("tools", toolNode)
        .addEdge("__start__", "agent")
        .addConditionalEdges("agent", shouldContinue)
        .addEdge("tools", "agent");

    // ========== Compile with Checkpointer ==========
    const app = workflow.compile({
        checkpointer: new MongoDBSaver({
            client: mongoose.connection.getClient(),
            dbName: mongoose.connection.db.databaseName,
        }),
    });

    // ========== Invoke Agent ==========
    console.log(`[Agent] Starting conversation (thread: ${threadId})`);
    
    const result = await app.invoke(
        { 
            messages: [new HumanMessage(query)],
            lectureId: lectureId,
        },
        { 
            recursionLimit: 10,
            configurable: { thread_id: threadId }
        }
    );

    const finalMessage = result.messages[result.messages.length - 1];
    
    console.log('[Agent] Conversation complete');
    
    return {
        answer: finalMessage.content,
        threadId: threadId,
        messageCount: result.messages.length,
    };
}