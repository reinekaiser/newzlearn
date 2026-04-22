import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL,
            "http://localhost:5173",
            "https://www.newzlearn.id.vn",
            "https://newzlearn.id.vn"
        ],
        credentials: true,
    },
});

const sessions = {};
const participants = {};
const activeSharers = new Map();

io.on("connection", (socket) => {
    socket.on("join-session", ({ sessionId, userName, userId, firstName, lastName, role, video, audio }) => {
        socket.join(sessionId);
        if (!sessions[sessionId]) {
            sessions[sessionId] = {
                participants: [],
            };
        }

        const participant = {
            socketId: socket.id,
            userName,
            role: role || "student",
            video,
            audio,
            userId,
            firstName,
            lastName
        };

        sessions[sessionId].participants.push(participant);

        participants[socket.id] = {
            sessionId,
            ...participant,
        };

        io.to(sessionId).emit("user-joined", participant);

        socket.emit("session-users", sessions[sessionId].participants);

        const currentSharer = activeSharers.get(sessionId);
        if (currentSharer) {
            socket.emit("current-screen-sharer", {
                sessionId,
                uid: currentSharer.uid,
                userName: currentSharer.userName,
            });
        }

        console.log(`${userName} joined room ${sessionId}`);
    });

    socket.on("toggle-media", ({ type, enabled }) => {
        const participant = participants[socket.id];
        if (participant) {
            participant[type] = enabled;
            const sessionId = participant.sessionId;

            io.to(sessionId).emit("user-media-changed", {
                socketId: socket.id,
                type,
                enabled,
            });
        }
    });

    socket.on("screen-share-started", (data) => {
        const { sessionId, uid } = data;
        if (!sessionId || !uid) return;
        const participant = participants[socket.id];
        if (participant) {
            console.log(`${participant.userName} with ${uid} started sharing ${sessionId}`);
            activeSharers.set(sessionId, { uid, userName: participant.userName });
            socket.to(sessionId).emit("user-screen-sharing", {
                sessionId,
                uid,
                userName: participant.userName,
            });
        }
    });

    socket.on("screen-share-stopped", (data) => {
        const { sessionId, uid } = data;
        if (!sessionId || !uid) return;

        const current = activeSharers.get(sessionId);
        if (current && current.uid === uid) {
            activeSharers.delete(sessionId);
            io.to(sessionId).emit("user-screen-stopped", { sessionId, uid });
            console.log(`User${uid} stopped sharing ${sessionId}`);
        }
    });

    socket.on("send-message", ({ text }) => {
        const participant = participants[socket.id];

        if (participant) {
            const chatMessage = {
                id: Date.now(),
                userId: socket.id,
                userName: participant.userName,
                message: text,
                time: new Date().toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            };

            io.to(participant.sessionId).emit("new-message", chatMessage);
        }
    });

    socket.on("disconnect", () => {
        const participant = participants[socket.id];
        if (participant) {
            const sessionId = participant.sessionId;

            if (sessions[sessionId]) {
                sessions[sessionId].participants = sessions[sessionId].participants.filter(
                    (p) => p.socketId !== socket.id,
                );
            }

            io.to(sessionId).emit("user-left", socket.id);

            if (sessions[sessionId].participants.length === 0) {
                delete sessions[sessionId];
            }

            delete participants[socket.id];
            console.log(`User ${participant.userName} disconnected`);
        }
    });
});
export { io, app, server };
