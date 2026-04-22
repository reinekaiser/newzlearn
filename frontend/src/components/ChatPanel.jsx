import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

const ChatPanel = ({ socket, messages, currentUser }) => {
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (newMessage.trim() && socket) {
            socket.emit("send-message", { text: newMessage.trim() });
            setNewMessage("");
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`p-2 rounded ${
                            msg.system
                                ? "bg-gray-700 text-gray-300 text-center text-sm"
                                : msg.userId === socket.id
                                ? "bg-blue-600 ml-auto max-w-[70%]"
                                : "bg-gray-800 max-w-[70%]"
                        }`}
                    >
                        {!msg.system && (
                            <>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-sm">{msg.userName}</span>
                                    <span className="text-xs opacity-70">{msg.time}</span>
                                </div>
                                <p className="text-sm">{msg.message}</p>
                            </>
                        )}
                        {msg.system && <p>{msg.message}</p>}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-gray-800 px-4 py-2 rounded border border-gray-300 focus:border-blue-500 text-white"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default ChatPanel;
