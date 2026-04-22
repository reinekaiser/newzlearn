"use client";

import { useState, useRef, useEffect } from "react";
import {
    Send,
    Bot,
    User,
    ChevronRight,
    Lightbulb,
    MessageCircle,
    Sparkles,
    GraduationCap,
} from "lucide-react";
import { useCallChatBotMutation } from "@/redux/api/courseApiSlice";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const SUGGESTED_QUESTIONS = [
    "Giải thích đơn giản hơn",
    "Những nội dung chính của bài giảng",
    "Cho câu hỏi luyện tập",
    "Cho ví dụ thực tế",
];

export function ChatbotPanel({ lectureId, isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [error, setError] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const [callChatBotAgent] = useCallChatBotMutation();

    const handleSendMessage = async (text) => {
        if (!text.trim()) return;

        const userMessage = {
            timestamp: new Date(),
            type: "user",
            content: text,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setIsTyping(true);

        // // Simulate AI response
        // setTimeout(() => {
        //   const botMessage = {
        //     id: Date.now() + 1,
        //     type: "bot",
        //     content: `Đã nhận câu hỏi: "${text}" để phân tích và trả lời.`,
        //   }
        //   setMessages((prev) => [...prev, botMessage])
        //   setIsTyping(false)
        // }, 1200)

        try {
            const response = await callChatBotAgent({
                lectureId,
                question: text,
                threadId: currentThreadId,
            });

            // console.log(response)

            const assistantMessage = {
                role: "assistant",
                content: response.data.data.answer,
                timestamp: new Date(),
                threadId: response.data.data.threadId,
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Update threadId if this is a new conversation
            if (!currentThreadId) {
                setCurrentThreadId(response.data.data.threadId);
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setError(
                err.response?.data?.error || "Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại.",
            );
        } finally {
            setIsTyping(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200 shadow-xl font-sans">
            {/* Header with Gradient */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0B8DEB] to-[#0066b3] shadow-md flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 shadow-sm">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-base tracking-wide">Trợ Lý AI</h3>
                        <p className="text-blue-100 text-xs font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                            Sẵn sàng hỗ trợ
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-all transform hover:rotate-90 duration-300"
                    title="Đóng"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2 scroll-smooth relative">
                {/* Background Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: "radial-gradient(#0B8DEB 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                ></div>

                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500">
                        <h4 className="text-xl font-bold text-slate-800 mb-2 text-center">
                            Xin chào!
                        </h4>
                        <p className="text-slate-500 text-center text-sm mb-8 px-4 leading-relaxed max-w-[280px]">
                            Tôi là trợ lý học tập ảo của bạn. Bạn có thắc mắc gì về bài học hôm nay
                            không?
                        </p>

                        <div className="w-full space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                                <Lightbulb className="w-3.5 h-3.5" /> Gợi ý câu hỏi
                            </div>
                            {SUGGESTED_QUESTIONS.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(q)}
                                    className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 
                           hover:border-[#0B8DEB] hover:shadow-md hover:text-[#0B8DEB] hover:bg-[#0B8DEB]/5 
                           transition-all duration-200 group flex items-center justify-between"
                                >
                                    {q}
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#0B8DEB]" />
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-end gap-3 group animate-in slide-in-from-bottom-2 duration-300 ${
                                    msg.type === "user" ? "flex-row-reverse" : ""
                                }`}
                            >
                                {/* Avatar */}
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white ${
                                        msg.type === "user"
                                            ? "bg-[#0B8DEB]"
                                            : "bg-gradient-to-br from-gray-100 to-gray-200"
                                    }`}
                                >
                                    {msg.type === "user" ? (
                                        <User className="w-5 h-5 text-white" />
                                    ) : (
                                        <Bot className="w-5 h-5 text-[#0B8DEB]" />
                                    )}
                                </div>

                                {/* Bubble */}
                                <div
                                    className={`px-3 py-2 max-w-[85%] shadow-sm relative ${
                                        msg.type === "user"
                                            ? "bg-[#0B8DEB] text-white rounded-2xl rounded-br-none"
                                            : "bg-white text-slate-700 rounded-2xl rounded-bl-none border border-slate-100"
                                    }`}
                                >
                                    {msg.type === "user" ? (
                                        <p className="text-sm leading-relaxed">{msg.content}</p>
                                    ) : (
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                // Code blocks
                                                code({
                                                    node,
                                                    inline,
                                                    className,
                                                    children,
                                                    ...props
                                                }) {
                                                    const match = /language-(\w+)/.exec(
                                                        className || "",
                                                    );
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter
                                                            style={vscDarkPlus}
                                                            language={match[1]}
                                                            PreTag="div"
                                                            className="rounded-lg my-3"
                                                            {...props}
                                                        >
                                                            {String(children).replace(/\n$/, "")}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code
                                                            className={`${className} px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-mono text-sm`}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                                // Paragraphs
                                                p({ children }) {
                                                    return (
                                                        <p className="mb-3 last:mb-0 leading-relaxed">
                                                            {children}
                                                        </p>
                                                    );
                                                },
                                                // Unordered lists
                                                ul({ children }) {
                                                    return (
                                                        <ul className="space-y-2 my-3">
                                                            {children}
                                                        </ul>
                                                    );
                                                },
                                                // Ordered lists
                                                ol({ children }) {
                                                    return (
                                                        <ol className="space-y-2 my-3 list-decimal list-inside">
                                                            {children}
                                                        </ol>
                                                    );
                                                },
                                                // List items
                                                li({ children }) {
                                                    return (
                                                        <li className="leading-relaxed">
                                                            {children}
                                                        </li>
                                                    );
                                                },
                                                // Bold
                                                strong({ children }) {
                                                    return (
                                                        <strong className="font-semibold">
                                                            {children}
                                                        </strong>
                                                    );
                                                },
                                                // Links
                                                a({ href, children }) {
                                                    return (
                                                        <a
                                                            href={href}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`underline hover:no-underline text-purple-600`}
                                                        >
                                                            {children}
                                                        </a>
                                                    );
                                                },
                                                // Headings
                                                h1({ children }) {
                                                    return (
                                                        <h1 className="text-xl font-bold mb-2 mt-4">
                                                            {children}
                                                        </h1>
                                                    );
                                                },
                                                h2({ children }) {
                                                    return (
                                                        <h2 className="text-lg font-bold mb-2 mt-3">
                                                            {children}
                                                        </h2>
                                                    );
                                                },
                                                h3({ children }) {
                                                    return (
                                                        <h3 className="text-base font-semibold mb-2 mt-2">
                                                            {children}
                                                        </h3>
                                                    );
                                                },
                                            }}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-end gap-3 animate-in fade-in duration-300">
                                <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white">
                                    <Bot className="w-5 h-5 text-[#0B8DEB]" />
                                </div>
                                <div className="bg-white border border-slate-100 px-4 py-4 rounded-2xl rounded-bl-none shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span
                                            className="w-2 h-2 bg-[#0B8DEB] rounded-full animate-bounce"
                                            style={{ animationDelay: "0ms" }}
                                        />
                                        <span
                                            className="w-2 h-2 bg-[#0B8DEB] rounded-full animate-bounce"
                                            style={{ animationDelay: "150ms" }}
                                        />
                                        <span
                                            className="w-2 h-2 bg-[#0B8DEB] rounded-full animate-bounce"
                                            style={{ animationDelay: "300ms" }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        {error && (
                            <div className="error-message">
                                <span className="icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                <div className="relative flex items-center">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-full text-sm 
                     focus:outline-none focus:ring-2 focus:ring-[#0B8DEB]/20 focus:border-[#0B8DEB] focus:bg-white 
                     transition-all shadow-inner text-slate-700 placeholder:text-slate-400"
                    />
                    <button
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={!inputValue.trim() || isTyping}
                        className="absolute right-2 p-2 bg-[#0B8DEB] text-white rounded-full 
                     hover:bg-[#097ac7] hover:shadow-lg disabled:opacity-40 disabled:hover:bg-[#0B8DEB] 
                     disabled:cursor-not-allowed transition-all duration-200 group"
                    >
                        <Send className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
                <div className="text-center mt-2.5">
                    <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                        <GraduationCap className="w-3 h-3 text-[#0B8DEB]" />
                        AI hỗ trợ học tập thông minh
                    </p>
                </div>
            </div>
        </div>
    );
}

// Toggle Button
export function ChatbotToggleButton({ isOpen, onClick }) {
    if (isOpen) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-50 group flex items-center gap-3 px-2 py-2 
               bg-[#0A8CE5] rounded-full 
                 backdrop-blur-sm"
        >
            <div className="w-10 h-10 flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform duration-300 backdrop-blur-md">
                <MessageCircle className="w-6 h-6 text-white drop-shadow-sm" />
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-white/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </button>
    );
}

export default ChatbotPanel;
