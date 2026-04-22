import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import io from "socket.io-client";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useSelector } from "react-redux";
import ChatPanel from "../components/ChatPanel";
import ParticipantsList from "../components/ParticipantsList";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Monitor,
    PhoneOff,
    MessageSquare,
    Users,
    X,
    Square,
} from "lucide-react";
import {
    useEndSessionMutation,
    useGetRTCTokenMutation,
    useGetSessionQuery,
    useJoinSessionMutation,
    useLeaveSessionMutation,
    useStartSessionMutation,
} from "@/redux/api/sessionApiSlice";

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || "YOUR_AGORA_APP_ID";
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

AgoraRTC.setLogLevel(3);

const SessionPage = () => {
    const { sessionId } = useParams();

    const navigate = useNavigate();
    const location = useLocation();
    const { userInfo: user } = useSelector((state) => state.auth);
    const preJoinState = location.state || {};

    const { data: session, isLoading: isLoadingSession, refetch } = useGetSessionQuery(sessionId);

    const [joinSession] = useJoinSessionMutation();
    const [leaveSession] = useLeaveSessionMutation();
    const [startSession] = useStartSessionMutation();
    const [endSession] = useEndSessionMutation();

    const [getRTCToken] = useGetRTCTokenMutation();

    const [hasJoinedAgora, setHasJoinedAgora] = useState(false);
    const isJoiningRef = useRef(false);

    // UI state
    const [isVideoOn, setIsVideoOn] = useState(preJoinState.videoEnabled ?? true);
    const [isAudioOn, setIsAudioOn] = useState(preJoinState.audioEnabled ?? true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);

    // Agora state
    const [client] = useState(() => AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const [screenTrack, setScreenTrack] = useState(null);
    const [remoteUsers, setRemoteUsers] = useState([]);

    // Socket state
    const [socket, setSocket] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [messages, setMessages] = useState([]);

    const [screenSharingUid, setScreenSharingUid] = useState(null);
    // Refs
    const localVideoRef = useRef(null);
    const screenVideoRef = useRef(null);

    const [showSidebar, setShowSidebar] = useState(false);
    const [activeSidebar, setActiveSidebar] = useState("participants");

    const isCleaningUpRef = useRef(false);

    const toggleSidebar = (type) => {
        if (showSidebar && activeSidebar === type) {
            setShowSidebar(false);
        } else {
            setActiveSidebar(type);
            setShowSidebar(true);
        }
    };

    // Initialize Socket.IO
    useEffect(() => {
        if (!session || !user) return;

        const newSocket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
        });

        newSocket.on("connect", () => {
            console.log("Socket connected");
            newSocket.emit("join-session", {
                sessionId: session._id,
                userId: user._id,
                userName: `${user.firstName || ""} ${user.lastName || ""}`,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                video: isVideoOn,
                audio: isAudioOn,
            });
        });

        newSocket.on("session-users", (users) => {
            setParticipants(users);
            updateUserMap(users);
        });

        newSocket.on("user-joined", (userInfo) => {
            setParticipants((prev) => [...prev, userInfo]);
            updateUserMap([userInfo])
        });

        newSocket.on("user-left", (socketId) => {
            setParticipants((prev) => {
                return prev.filter((p) => p.socketId !== socketId);
            });
        });

        newSocket.on("user-media-changed", ({ socketId, type, enabled }) => {
            setParticipants((prev) =>
                prev.map((p) => (p.socketId === socketId ? { ...p, [type]: enabled } : p)),
            );
        });

        newSocket.on("new-message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [session, user]);

    const [userMap, setUserMap] = useState(new Map()); // Map<agoraUid, userInfo>

    const updateUserMap = (usersList) => {
        const newMap = new Map();
        usersList.forEach((u) => {
            if (u.userId) {
                newMap.set(u.userId, {
                    name: u.userName || `${u.firstName || ""} ${u.lastName || ""}`,
                    role: u.role,
                });
            }
        });
        setUserMap(newMap);
    };

    const getUserName = (userId) => {
        const info = userMap.get(userId);
        return info ? info.name : `User ${userId}`;
    };

    useEffect(() => {
        if (!socket || !session) return;

        socket.on("user-screen-sharing", (data) => {
            console.log(data);
            if (data.sessionId !== session._id) return;
            setScreenSharingUid(data.uid);
            console.log(`User ${data.uid} started screen sharing`);
        });

        socket.on("user-screen-stopped", (data) => {
            console.log(data);
            if (data.sessionId !== session._id) return;
            if (screenSharingUid === data.uid) {
                setScreenSharingUid(null);
                console.log(`User ${data.uid} stopped screen sharing`);
            }
        });
        socket.emit("get-current-screen-sharer", { sessionId: session._id });

        socket.on("current-screen-sharer", (data) => {
            if (data.sessionId !== session._id) return;
            setScreenSharingUid(data.uid || null);
        });

        return () => {
            socket.off("user-screen-sharing");
            socket.off("user-screen-stopped");
            socket.off("current-screen-sharer");
        };
    }, [socket, session, screenSharingUid]);

    useEffect(() => {
        if (!session || session.status !== "live" || hasJoinedAgora) return;

        console.log("initializeAgora");
        initializeAgora();
    }, [session?.status, hasJoinedAgora]);

    const handleAutoStartSession = async () => {
        try {
            console.log("Teacher joined - Auto starting session...");
            await startSession(session._id).unwrap();
            refetch();
        } catch (error) {
            console.error("Error auto-starting session:", error);
        }
    };

    useEffect(() => {
        if (session && user.role === "instructor" && session.status !== "live") {
            handleAutoStartSession();
        }
    }, [session, user]);

    const initializeAgora = async () => {
        try {
            // Setup Agora event listeners
            if (isJoiningRef.current || hasJoinedAgora) {
                console.log("Already joining or joined");
                return;
            }

            if (client.connectionState === "CONNECTED" || client.connectionState === "CONNECTING") {
                console.log("Already connected/connecting");
                return;
            }

            isJoiningRef.current = true;

            client.on("user-published", async (user, mediaType) => {
                await client.subscribe(user, mediaType);
                console.log("Subscribed to user:", user.uid);

                if (mediaType === "video") {
                    setRemoteUsers((prev) => {
                        const exists = prev.find((u) => u.uid === user.uid);
                        if (exists) {
                            return prev.map((u) => (u.uid === user.uid ? user : u));
                        }
                        return [...prev, user];
                    });
                }

                if (mediaType === "audio") {
                    const speakerDeviceId =
                        preJoinState.speakerDeviceId ||
                        localStorage.getItem("preferredSpeakerDevice");

                    if (speakerDeviceId && user.audioTrack) {
                        try {
                            await user.audioTrack.setPlaybackDevice(speakerDeviceId);
                        } catch (err) {
                            console.warn("Could not set speaker device:", err);
                        }
                    }

                    user.audioTrack?.play();
                }
            });

            client.on("user-unpublished", (user, mediaType) => {
                if (mediaType === "video") {
                    setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
                }
            });

            client.on("user-left", (user) => {
                setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
            });

            const tokenResponse = await getRTCToken({
                channelName: session._id,
                uid: user._id,
                role: "publisher",
            }).unwrap();

            const { token } = tokenResponse.data;

            if (preJoinState.localVideoTrack && preJoinState.localAudioTrack) {
                setLocalVideoTrack(preJoinState.localVideoTrack);
                setLocalAudioTrack(preJoinState.localAudioTrack);

                await client.join(AGORA_APP_ID, session._id, token, user._id);

                // Publish tracks
                await client.publish([preJoinState.localVideoTrack, preJoinState.localAudioTrack]);

                // Play local video
                if (localVideoRef.current) {
                    preJoinState.localVideoTrack.play(localVideoRef.current);
                }
            } else {
                // Create new tracks (fallback)
                const videoDeviceId = localStorage.getItem("preferredVideoDevice");
                const audioDeviceId = localStorage.getItem("preferredAudioDevice");

                const videoTrack = await AgoraRTC.createCameraVideoTrack({
                    cameraId: videoDeviceId || undefined,
                });
                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                    microphoneId: audioDeviceId || undefined,
                });

                setLocalVideoTrack(videoTrack);
                setLocalAudioTrack(audioTrack);

                await client.join(AGORA_APP_ID, session._id, token, user._id);
                await client.publish([videoTrack, audioTrack]);

                if (localVideoRef.current) {
                    videoTrack.play(localVideoRef.current);
                }
            }

            await joinSession(session._id).unwrap();
            setHasJoinedAgora(true);

            console.log("Joined Agora channel successfully");
        } catch (error) {
            console.error("Error initializing Agora:", error);
            alert("Lỗi kết nối video: " + error.message);
        }
    };

    const cleanup = async () => {
        if (isCleaningUpRef.current) return;
        isCleaningUpRef.current = true;

        try {
            // ❗ GỠ TRACK-ENDED HANDLER
            if (screenTrack) {
                screenTrack.off?.("track-ended");
            }

            // LEAVE CHANNEL TRƯỚC
            if (client && client.connectionState === "CONNECTED") {
                await client.leave();
            }

            // STOP TRACKS (sau khi leave)
            if (screenTrack) {
                screenTrack.stop();
                screenTrack.close();
                setScreenTrack(null);
            }

            if (localVideoTrack) {
                localVideoTrack.stop();
                localVideoTrack.close();
                setLocalVideoTrack(null);
            }

            if (localAudioTrack) {
                localAudioTrack.stop();
                localAudioTrack.close();
                setLocalAudioTrack(null);
            }
        } catch (err) {
            console.error("Cleanup error:", err);
        }
    };

    const toggleVideo = async () => {
        if (localVideoTrack) {
            const newState = !isVideoOn;
            await localVideoTrack.setEnabled(newState);
            setIsVideoOn(newState);

            if (socket) {
                socket.emit("toggle-media", { type: "video", enabled: newState });
            }
        }
    };

    const toggleAudio = async () => {
        if (localAudioTrack) {
            const newState = !isAudioOn;
            await localAudioTrack.setEnabled(newState);
            setIsAudioOn(newState);

            if (socket) {
                socket.emit("toggle-media", { type: "audio", enabled: newState });
            }
        }
    };

    const stopScreenShare = async () => {
        try {
            if (screenTrack) {
                screenTrack.stop();
                screenTrack.close();

                if (client.connectionState === "CONNECTED") {
                    await client.unpublish(screenTrack);
                }

                setScreenTrack(null);
            }

            if (localVideoTrack && client.connectionState === "CONNECTED") {
                await client.publish(localVideoTrack);
                console.log(localVideoRef);
                if (localVideoRef.current) {
                    console.log("có local video");
                    console.log("localVideoRef", localVideoRef);
                    localVideoTrack.play(localVideoRef.current);
                }
            }

            setIsScreenSharing(false);

            socket?.emit("screen-share-stopped", {
                sessionId: session._id, // hoặc channel name bạn dùng
                uid: client.uid, // uid của người share (Agora UID)
            });
        } catch (err) {
            console.error("Stop screen share error:", err);
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (client.connectionState !== "CONNECTED") {
                alert("Vui lòng đợi kết nối video trước khi chia sẻ màn hình");
                return;
            }

            // STOP screen share
            if (isScreenSharing) {
                await stopScreenShare();
                return;
            }

            // START screen share
            let screen;
            try {
                screen = await AgoraRTC.createScreenVideoTrack({
                    encoderConfig: "1080p_1",
                });
            } catch (err) {
                // Người dùng nhấn Cancel
                console.warn("User canceled screen sharing");
                return;
            }

            if (localVideoTrack) {
                await client.unpublish(localVideoTrack);
            }

            await client.publish(screen);
            setScreenTrack(screen);
            setIsScreenSharing(true);

            console.log(
                socket?.emit("screen-share-started", {
                    sessionId: session._id, // hoặc channel name bạn dùng
                    uid: client.uid, // uid của người share (Agora UID)
                }),
            );
            socket?.emit("screen-share-started", {
                sessionId: session._id, // hoặc channel name bạn dùng
                uid: client.uid, // uid của người share (Agora UID)
            });

            // Khi user nhấn Stop Sharing trên trình duyệt
            screen.on("track-ended", async () => {
                console.log("Screen sharing stopped by browser");
                await stopScreenShare();
            });
        } catch (error) {
            console.error("Screen share error:", error);
            alert("Không thể chia sẻ màn hình");
        }
    };

    useEffect(() => {
        if (localVideoTrack && localVideoRef.current && isVideoOn) {
            localVideoTrack.play(localVideoRef.current);
        }
    }, [localVideoTrack, isVideoOn]);

    useEffect(() => {
        if (screenTrack && screenVideoRef.current) {
            screenTrack.play(screenVideoRef.current);
        }
    }, [screenTrack]);

    const handleEndSession = async () => {
        if (!window.confirm("Bạn có chắc muốn kết thúc buổi học?")) return;

        try {
            await endSession(session._id).unwrap();
            await cleanup();
            navigate(`/instructor/sessions`);
        } catch (error) {
            console.error("Error ending session:", error);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm("Bạn có chắc muốn rời phòng?")) return;

        try {
            await leaveSession(session._id).unwrap();
            await cleanup();
            navigate(`/student/my-courses`);
        } catch (error) {
            console.error("Error leaving session:", error);
        }
    };

    // useEffect(() => {
    //     remoteUsers.forEach((user) => {
    //         if (user.videoTrack) {
    //             const isScreenTrack = user.videoTrack._ID?.includes("screen");

    //             if (isScreenTrack) {
    //                 // Play screen share in main area
    //                 const element = document.getElementById(`remote-screen-${user.uid}`);
    //                 if (element && !element.hasChildNodes()) {
    //                     user.videoTrack.play(element);
    //                 }
    //             } else {
    //                 // Play camera in thumbnail or grid
    //                 const elementGrid = document.getElementById(`remote-${user.uid}`);
    //                 const elementThumb = document.getElementById(`remote-thumb-${user.uid}`);

    //                 if (elementGrid && !elementGrid.hasChildNodes()) {
    //                     user.videoTrack.play(elementGrid);
    //                 }
    //                 if (elementThumb && !elementThumb.hasChildNodes()) {
    //                     user.videoTrack.play(elementThumb);
    //                 }
    //             }
    //         }
    //     });
    // }, [remoteUsers, screenSharingUser]);

    // useEffect(() => {
    //     remoteUsers.forEach((user) => {
    //         if (user.videoTrack) {
    //             const element = document.getElementById(`remote-${user.uid}`);
    //             if (element && !element.hasChildNodes()) {
    //                 user.videoTrack.play(element);
    //             }
    //         }
    //     });
    // }, [remoteUsers]);

    useEffect(() => {
        remoteUsers.forEach((remoteUser) => {
            if (remoteUser.videoTrack) {
                let targetElementId;

                if (remoteUser.uid === screenSharingUid) {
                    // Đây là track screen share → play full screen
                    targetElementId = `remote-screen-${remoteUser.uid}`;
                } else {
                    // Camera bình thường → play ở grid/thumbnail
                    targetElementId = `remote-${remoteUser.uid}`;
                }

                const element = document.getElementById(targetElementId);

                if (element) {
                    // Tránh play nhiều lần gây lỗi hoặc flicker
                    if (!element.hasChildNodes() || !element.querySelector("video")) {
                        console.log(
                            `Playing video for uid ${remoteUser.uid} into ${targetElementId}`,
                        );
                        remoteUser.videoTrack.play(element);
                    }
                } else {
                    console.warn(`Element not found for ${targetElementId}`);
                }
            }
        });

        const localVideo = document.getElementById("local-video");
        if (localVideo) {
            if (!localVideo.hasChildNodes() || !localVideo.querySelector("video")) {
                if (localVideoTrack && client.connectionState === "CONNECTED") {
                    localVideoTrack.play(localVideo);
                }
            }
        }
    }, [remoteUsers, screenSharingUid, isScreenSharing]);

    if (isLoadingSession) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Đang tải buổi học...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    if (session.status !== "live") {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">{session.sessionName}</h2>
                    {user.role === "instructor" ? (
                        <>
                            <p className="text-gray-400 mb-6">Đang khởi động buổi học...</p>
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 mb-6">
                                Đang chờ giảng viên bắt đầu buổi học...
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Buổi học sẽ tự động bắt đầu khi giảng viên tham gia
                            </p>
                            <button
                                onClick={() => navigate(`/student/prejoin/${session._id}`)}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg mb-3"
                            >
                                Quay lại trang chuẩn bị
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    {
        /* Main Video Area */
    }
    <div className="flex-1 flex flex-col">
        {/* Video Grid / Main Content */}
        <div className="flex-1 relative bg-black overflow-hidden">
            {/* Ở đây là phần video chính - bạn giữ logic hiện tại */}
            <div
                ref={screenVideoRef}
                className={`absolute inset-0 ${isScreenSharing ? "block" : "hidden"}`}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-4 h-full">
                {/* Local video nếu camera bật */}
                <div
                    ref={localVideoRef}
                    className={`absolute bottom-20 right-4 w-52 h-40 rounded-lg border-2 border-blue-500 shadow-xl z-20 bg-gray-800 overflow-hidden
                        ${isScreenSharing ? "w-48 h-32 bottom-6 right-6 z-20 rounded-lg border border-gray-600" : ""}
                            `}
                    style={{ display: isVideoOn ? "block" : "none" }}
                />

                {/* Remote users */}
                {remoteUsers.map((user) => (
                    <div
                        key={user.uid}
                        className={`relative bg-gray-800 rounded-xl overflow-hidden aspect-video ${isScreenSharing ? "hidden" : "block"}`}
                    >
                        <div id={`remote-${user.uid}`} className="w-full h-full" />
                        <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm">
                            User {user.uid}
                        </div>
                    </div>
                ))}

                {/* Placeholder khi camera tắt & không share */}
                {!isVideoOn && !isScreenSharing && remoteUsers.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-5xl font-bold mx-auto mb-4">
                                {user.lastName.charAt(0)}
                            </div>
                            <p className="text-2xl">Đang chờ mọi người...</p>
                        </div>
                    </div>
                )}
            </div>
            {/* Floating self-view label khi screen sharing */}
            {isScreenSharing && isVideoOn && (
                <div className="absolute bottom-24 right-6 z-30">
                    <div className="bg-black/70 px-3 py-1 rounded text-sm">
                        {user.lastName} (Bạn)
                    </div>
                </div>
            )}
        </div>

        {/* Bottom Controls Bar - giống Google Meet */}
        <div className="h-20 bg-gray-900/95 border-t border-gray-800 flex items-center justify-between px-6">
            {/* Left - có thể để meeting info hoặc timer */}
            <div className="text-sm text-gray-400 flex flex-col">
                <span>{session.sessionName}</span> <span>{session.course.title}</span>
            </div>

            {/* Center - các nút chính */}
            <div className="flex items-center gap-3">
                <ControlButton
                    onClick={toggleAudio}
                    isActive={isAudioOn}
                    activeClass="bg-gray-700"
                    inactiveClass="bg-red-600 hover:bg-red-700"
                    icon={isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                    tooltip={isAudioOn ? "Tắt mic" : "Bật mic"}
                />

                <ControlButton
                    onClick={toggleVideo}
                    isActive={isVideoOn}
                    activeClass="bg-gray-700"
                    inactiveClass="bg-red-600 hover:bg-red-700"
                    icon={isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                    tooltip={isVideoOn ? "Tắt camera" : "Bật camera"}
                />

                {user.role === "instructor" && (
                    <ControlButton
                        onClick={toggleScreenShare}
                        isActive={isScreenSharing}
                        activeClass="bg-blue-600"
                        inactiveClass="bg-gray-700 hover:bg-gray-600"
                        icon={<Monitor size={24} />}
                        tooltip={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
                    />
                )}
            </div>

            {/* Right - People, Chat, Leave */}
            <div className="flex items-center gap-3">
                <ControlButton
                    onClick={() => toggleSidebar("participants")}
                    isActive={showSidebar && activeSidebar === "participants"}
                    icon={<Users size={24} />}
                    tooltip="Người tham gia"
                />

                <ControlButton
                    onClick={() => toggleSidebar("chat")}
                    isActive={showSidebar && activeSidebar === "chat"}
                    icon={<MessageSquare size={24} />}
                    tooltip="Trò chuyện"
                />

                {user.role === "instructor" ? (
                    <button
                        onClick={handleEndSession}
                        className="ml-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium flex items-center gap-2"
                    >
                        <Square size={20} /> Kết thúc
                    </button>
                ) : (
                    <button
                        onClick={handleLeave}
                        className="ml-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium flex items-center gap-2"
                    >
                        <PhoneOff size={20} /> Rời phòng
                    </button>
                )}
            </div>
        </div>
    </div>;

    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
            <div className="flex-1 flex flex-col">
                {/* Video Grid / Main Content */}
                <div className="flex-1 relative bg-black overflow-hidden">
                    {/* 1. Remote Screen Share FULL SCREEN (ưu tiên cao nhất nếu có ai share) */}
                    {screenSharingUid && screenSharingUid !== client.uid && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                id={`remote-screen-${screenSharingUid}`}
                                className="w-full h-full object-contain" // Giữ tỷ lệ gốc, không giãn
                            />
                            {/* Label overlay */}
                            <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg text-white z-20 shadow-lg">
                                {`${getUserName(screenSharingUid)}`} đang chia sẻ màn hình
                            </div>
                        </div>
                    )}

                    {/* 2. Local Screen Share FULL SCREEN (khi chính bạn share) */}
                    {isScreenSharing && (screenSharingUid === client.uid || !screenSharingUid) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div
                                ref={screenVideoRef}
                                className="w-full h-full object-contain" // Giữ tỷ lệ gốc
                                style={{ objectFit: "contain" }}
                            />
                            {/* Label overlay cho local share */}
                            <div className="absolute bottom-4 left-4 bg-black/70 px-4 py-2 rounded-lg text-white z-40 shadow-lg">
                                Bạn đang chia sẻ màn hình
                            </div>
                        </div>
                    )}
                    {/* 3. Grid camera (chỉ hiển thị khi KHÔNG có screen share nào) */}
                    {!screenSharingUid && !isScreenSharing && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 p-4 h-full">
                            {/* Local camera */}
                            <div
                                id="local-video"
                                ref={localVideoRef}
                                className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video"
                                style={{ display: isVideoOn ? "block" : "hidden" }}
                            />

                            {/* Remote cameras */}
                            {remoteUsers.map((user) => (
                                <div
                                    key={user.uid}
                                    className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video"
                                >
                                    <div id={`remote-${user.uid}`} className="w-full h-full" />
                                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-sm">
                                        {`User ${getUserName(user.uid)}`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 4. Local camera thumbnail nổi (khi có screen share - local hoặc remote) */}
                    {/* {isVideoOn && (isScreenSharing || screenSharingUid) && (
                        <div
                            ref={localVideoRef}
                            className="absolute bottom-6 right-6 w-64 h-48 rounded-xl overflow-hidden border-4 border-blue-500 shadow-2xl z-30 bg-gray-800"
                        />
                    )} */}

                    {/* 5. Floating label cho local khi share */}
                    {isScreenSharing && isVideoOn && (
                        <div className="absolute bottom-6 left-6 z-30 bg-black/70 px-3 py-1 rounded text-sm text-white">
                            {user.lastName} (Bạn) - Camera
                        </div>
                    )}

                    {/* 6. Placeholder khi trống */}
                    {!isVideoOn &&
                        !isScreenSharing &&
                        !screenSharingUid &&
                        remoteUsers.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-center text-white">
                                <div>
                                    <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-5xl font-bold mx-auto mb-4">
                                        {user.lastName?.charAt(0) || "?"}
                                    </div>
                                    <p className="text-2xl">Đang chờ mọi người tham gia...</p>
                                </div>
                            </div>
                        )}
                </div>

                {/* Bottom Controls Bar - giống Google Meet */}
                <div className="h-20 bg-gray-900/95 border-t border-gray-800 flex items-center justify-between px-6">
                    {/* Left - có thể để meeting info hoặc timer */}
                    <div className="text-sm text-gray-400 flex flex-col">
                        <span>{session.sessionName}</span> <span>{session.course.title}</span>
                    </div>

                    {/* Center - các nút chính */}
                    <div className="flex items-center gap-3">
                        <ControlButton
                            onClick={toggleAudio}
                            isActive={isAudioOn}
                            activeClass="bg-gray-700"
                            inactiveClass="bg-red-600 hover:bg-red-700"
                            icon={isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                            tooltip={isAudioOn ? "Tắt mic" : "Bật mic"}
                        />

                        <ControlButton
                            onClick={toggleVideo}
                            isActive={isVideoOn}
                            activeClass="bg-gray-700"
                            inactiveClass="bg-red-600 hover:bg-red-700"
                            icon={isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                            tooltip={isVideoOn ? "Tắt camera" : "Bật camera"}
                        />

                        {user.role === "instructor" && (
                            <ControlButton
                                onClick={toggleScreenShare}
                                isActive={isScreenSharing}
                                activeClass="bg-blue-600"
                                inactiveClass="bg-gray-700 hover:bg-gray-600"
                                icon={<Monitor size={24} />}
                                tooltip={isScreenSharing ? "Dừng chia sẻ" : "Chia sẻ màn hình"}
                            />
                        )}
                    </div>

                    {/* Right - People, Chat, Leave */}
                    <div className="flex items-center gap-3">
                        <ControlButton
                            onClick={() => toggleSidebar("participants")}
                            isActive={showSidebar && activeSidebar === "participants"}
                            icon={<Users size={24} />}
                            tooltip="Người tham gia"
                        />

                        <ControlButton
                            onClick={() => toggleSidebar("chat")}
                            isActive={showSidebar && activeSidebar === "chat"}
                            icon={<MessageSquare size={24} />}
                            tooltip="Trò chuyện"
                        />

                        {user.role === "instructor" ? (
                            <button
                                onClick={handleEndSession}
                                className="ml-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium flex items-center gap-2"
                            >
                                <Square size={20} /> Kết thúc
                            </button>
                        ) : (
                            <button
                                onClick={handleLeave}
                                className="ml-4 px-6 py-3 bg-red-600 hover:bg-red-700 rounded-full font-medium flex items-center gap-2"
                            >
                                <PhoneOff size={20} /> Rời phòng
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {/* Right Sidebar (Participants & Chat) */}
            {showSidebar && (
                <div className="w-[350px] bg-gray-800 border-l border-gray-700 flex flex-col transition-all duration-300">
                    {/* Header của sidebar */}
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold">
                            {activeSidebar === "participants" ? "Người tham gia" : "Trò chuyện"}
                        </h3>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="p-2 hover:bg-gray-700 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 overflow-hidden">
                        {activeSidebar === "participants" ? (
                            <ParticipantsList participants={participants} />
                        ) : (
                            <ChatPanel socket={socket} messages={messages} currentUser={user} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

function ControlButton({ icon, onClick, isActive, activeClass, inactiveClass, tooltip }) {
    return (
        <div className="relative group">
            <button
                onClick={onClick}
                className={`p-4 rounded-full transition-colors ${
                    isActive ? activeClass : inactiveClass
                }`}
                title={tooltip}
            >
                {icon}
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {tooltip}
            </div>
        </div>
    );
}

export default SessionPage;
