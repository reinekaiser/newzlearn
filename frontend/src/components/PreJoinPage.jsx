import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import {
    Video,
    VideoOff,
    Mic,
    MicOff,
    Settings,
    Monitor,
    ArrowLeft,
    Users,
    Calendar,
    Clock,
} from "lucide-react";
import { useSelector } from "react-redux";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useGetSessionQuery } from "@/redux/api/sessionApiSlice";


AgoraRTC.setLogLevel(3);

const PreJoinPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { userInfo: user } = useSelector((state) => state.auth);

    const { data: session, isLoading } = useGetSessionQuery(sessionId);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoDevices, setVideoDevices] = useState([]);
    const [audioDevices, setAudioDevices] = useState([]);
    const [speakerDevices, setSpeakerDevices] = useState([]);
    const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
    const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
    const [selectedSpeakerDevice, setSelectedSpeakerDevice] = useState("");

    const [localVideoTrack, setLocalVideoTrack] = useState(null);
    const [localAudioTrack, setLocalAudioTrack] = useState(null);
    const videoPreviewRef = useRef(null);

    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        if (session) {
            initializeDevices();
        }
    }, [session]);

    const initializeDevices = async () => {
        try {
            // Request permissions
            // await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const devices = await AgoraRTC.getDevices();
            const videoInputs = devices.filter((device) => device.kind === "videoinput");
            const audioInputs = devices.filter((device) => device.kind === "audioinput");
            const audioOutputs = devices.filter((device) => device.kind === "audiooutput");

            setVideoDevices(videoInputs);
            setAudioDevices(audioInputs);
            setSpeakerDevices(audioOutputs);

            // Select default devices
            if (videoInputs.length > 0) {
                setSelectedVideoDevice(videoInputs[0].deviceId);
            }

            if (audioInputs.length > 0) {
                setSelectedAudioDevice(audioInputs[0].deviceId);
            }

            if (audioOutputs.length > 0) {
                setSelectedSpeakerDevice(audioOutputs[0].deviceId);
            }

            // Create preview tracks
            await createPreviewTracks(videoInputs[0]?.deviceId, audioInputs[0]?.deviceId);
        } catch (error) {
            console.error("Error initializing devices:", error);
            alert("Không thể truy cập camera/microphone. Vui lòng cấp quyền và thử lại.");
        }
    };

    const createPreviewTracks = async (videoDeviceId, audioDeviceId) => {
        try {
            if (localVideoTrack) {
                localVideoTrack.stop();
                localVideoTrack.close();
                if (videoPreviewRef.current) {
                    // Xóa tất cả video elements cũ
                    const videoElements = videoPreviewRef.current.querySelectorAll("video");
                    videoElements.forEach((video) => video.remove());
                }
            }
            if (localAudioTrack) {
                localAudioTrack.stop();
                localAudioTrack.close();
            }

            const videoTrack = await AgoraRTC.createCameraVideoTrack({
                cameraId: videoDeviceId,
                encoderConfig: "720p_2",
            });

            const audioTrack = await AgoraRTC.createMicrophoneAudioTrack({
                microphoneId: audioDeviceId,
            });

            setLocalVideoTrack(videoTrack);
            setLocalAudioTrack(audioTrack);

            if (videoPreviewRef.current) {
                videoTrack.play(videoPreviewRef.current);
            }

            await videoTrack.setEnabled(videoEnabled);
            await audioTrack.setEnabled(audioEnabled);
        } catch (error) {
            console.error("Error creating preview tracks:", error);
        }
    };

    const toggleVideo = async () => {
        if (localVideoTrack) {
            const newState = !videoEnabled;
            await localVideoTrack.setEnabled(newState);
            setVideoEnabled(newState);
        }
    };

    const toggleAudio = async () => {
        if (localAudioTrack) {
            const newState = !audioEnabled;
            await localAudioTrack.setEnabled(newState);
            setAudioEnabled(newState);
        }
    };

    const handleVideoDeviceChange = async (deviceId) => {
        setSelectedVideoDevice(deviceId);
        await createPreviewTracks(deviceId, selectedAudioDevice);
    };

    const handleAudioDeviceChange = async (deviceId) => {
        setSelectedAudioDevice(deviceId);
        await createPreviewTracks(selectedVideoDevice, deviceId);
    };

    useEffect(() => {
        return () => cleanup();
    }, []);

    const cleanup = () => {
        if (localVideoTrack) {
            localVideoTrack.stop();
            localVideoTrack.close();
            localVideoTrack.detach();
        }
        if (localAudioTrack) {
            localAudioTrack.stop();
            localAudioTrack.close();
        }

        if (videoPreviewRef.current) {
            videoPreviewRef.current.innerHTML = "";
        }
    };

    const handleJoinSession = async () => {
        if (!session) return;

        setIsJoining(true);

        console.log(user)
        try {
            localStorage.setItem("preferredVideoDevice", selectedVideoDevice);
            localStorage.setItem("preferredAudioDevice", selectedAudioDevice);
            localStorage.setItem("preferredSpeakerDevice", selectedSpeakerDevice);
            localStorage.setItem("videoEnabled", videoEnabled.toString());
            localStorage.setItem("audioEnabled", audioEnabled.toString());

            navigate(user.role === 'instructor' ? `/instructor/sessions/join/${sessionId}` : `/student/sessions/join/${sessionId}`, {
                state: {
                    videoEnabled,
                    audioEnabled,
                    videoDeviceId: selectedVideoDevice,
                    audioDeviceId: selectedAudioDevice,
                    speakerDeviceId: selectedSpeakerDevice,
                },
            });
        } catch (error) {
            console.error("Error joining session:", error);
            setIsJoining(false);
            alert("Lỗi khi tham gia buổi học");
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Đang tải buổi học...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="container mx-auto w-full">
                {/* Back Button */}
                <button
                    onClick={() => {
                        navigate(-1);
                        cleanup();
                    }}
                    className="mb-4 flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-200 rounded"
                >
                    <ArrowLeft size={20} />
                    Quay lại
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Video Preview */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg overflow-hidden">
                            {/* Video Preview */}
                            <div className="relative rounded-lg aspect-video bg-black">
                                <div
                                    ref={videoPreviewRef}
                                    className={`w-full h-full ${videoEnabled ? "" : "hidden"}`}
                                />

                                {!videoEnabled && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-white">Camera đã tắt</p>
                                    </div>
                                )}

                                {/* User name overlay */}
                                <div className="absolute bottom-4 left-4 text-white px-3 py-1 rounded">
                                    {`${user.firstName ? user.firstName : ""} ${
                                        user.lastName ? user.lastName : ""
                                    }`}
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-1/2 flex items-center justify-center gap-4">
                                    {/* Mic Toggle */}
                                    <button
                                        onClick={toggleAudio}
                                        className={`p-4 rounded-full border transition-colors ${
                                            audioEnabled
                                                ? "text-white border-white"
                                                : "bg-red-600 text-white border-red-600"
                                        }`}
                                        title={audioEnabled ? "Tắt microphone" : "Bật microphone"}
                                    >
                                        {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
                                    </button>

                                    {/* Camera Toggle */}
                                    <button
                                        onClick={toggleVideo}
                                        className={`p-4 rounded-full border transition-colors ${
                                            videoEnabled
                                                ? "text-white border-white"
                                                : "bg-red-600 text-white border-red-600"
                                        }`}
                                        title={videoEnabled ? "Tắt camera" : "Bật camera"}
                                    >
                                        {videoEnabled ? (
                                            <Video size={24} />
                                        ) : (
                                            <VideoOff size={24} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-4 items-center justify-center p-4 rounded-lg">
                                {/* Camera Select */}
                                <Select
                                    value={selectedVideoDevice}
                                    onValueChange={handleVideoDeviceChange}
                                >
                                    <SelectTrigger className="max-w-[200px] border border-gray-300">
                                        <SelectValue placeholder="Select Camera" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {videoDevices.map((device) => (
                                            <SelectItem
                                                key={device.deviceId}
                                                value={device.deviceId}
                                            >
                                                {device.label ||
                                                    `Camera ${device.deviceId.slice(0, 5)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Microphone Select */}
                                <Select
                                    value={selectedAudioDevice}
                                    onValueChange={handleAudioDeviceChange}
                                >
                                    <SelectTrigger className="max-w-[200px] border border-gray-300">
                                        <SelectValue placeholder="Select Microphone" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {audioDevices.map((device) => (
                                            <SelectItem
                                                key={device.deviceId}
                                                value={device.deviceId}
                                            >
                                                {device.label ||
                                                    `Microphone ${device.deviceId.slice(0, 5)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={selectedSpeakerDevice}
                                    onValueChange={setSelectedSpeakerDevice}
                                >
                                    <SelectTrigger className="max-w-[200px] border border-gray-300">
                                        <SelectValue placeholder="Select Speaker / Headphones" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {speakerDevices.map((device) => (
                                            <SelectItem
                                                key={device.deviceId}
                                                value={device.deviceId}
                                            >
                                                {device.label ||
                                                    `Speaker ${device.deviceId.slice(0, 5)}`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Right: Session Info */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg p-6 space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">{session.sessionName}</h2>
                                <p className="text-gray-400">{session.course?.title}</p>
                            </div>

                            {/* Session Details */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm text-gray-400">Thời gian</p>
                                        <p className="font-medium">
                                            {formatDateTime(session.scheduledStart)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Clock size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm text-gray-400">Thời lượng</p>
                                        <p className="font-medium">
                                            {Math.round(
                                                (new Date(session.scheduledEnd) -
                                                    new Date(session.scheduledStart)) /
                                                    (1000 * 60),
                                            )}{" "}
                                            phút
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Users size={20} className="text-gray-400 mt-1" />
                                    <div>
                                        <p className="text-sm text-gray-400">Người tham gia</p>
                                        <p className="font-medium">
                                            {session.participants?.length || 0} người đã tham gia
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Session Status */}
                            <div className="mt-6">
                                <button
                                    onClick={handleJoinSession}
                                    disabled={isJoining}
                                    className="w-full py-2 bg-primary text-white disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isJoining ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Đang tham gia...
                                        </>
                                    ) : (
                                        <>
                                            <Video size={24} />
                                            Tham gia ngay
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreJoinPage;
