import {
    Sheet,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useGetSessionsByCourseQuery } from "@/redux/api/sessionApiSlice";
import {
    TvMinimalPlay,
    Calendar,
    Clock,
    Video,
    Users,
    BookOpen,
    Play,
    CheckCircle,
    AlertCircle,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const LiveSessionsSheet = ({ courseId }) => {
    console.log("courseId", courseId);
    const navigate = useNavigate();

    const [filter, setFilter] = useState("upcoming");

    const { data: sessions, isLoading: isLoadingSession } = useGetSessionsByCourseQuery(courseId);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Check if today
        if (date.toDateString() === today.toDateString()) {
            return `Hôm nay, ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
        }

        // Check if tomorrow
        if (date.toDateString() === tomorrow.toDateString()) {
            return `Ngày mai, ${date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
        }

        return date.toLocaleString("vi-VN", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getTimeUntilSession = (scheduledStart) => {
        const now = new Date();
        const start = new Date(scheduledStart);
        const diff = start - now;

        if (diff < 0) return null;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} ngày nữa`;
        } else if (hours > 0) {
            return `${hours} giờ ${minutes} phút nữa`;
        } else {
            return `${minutes} phút nữa`;
        }
    };

    const getFilteredSessions = () => {
        const now = new Date();

        switch (filter) {
            case "upcoming":
                return sessions
                    .filter((s) => s.status === "scheduled" && new Date(s.scheduledStart) > now)
                    .sort((a, b) => new Date(a.scheduledStart) - new Date(b.scheduledStart));

            case "live":
                return sessions.filter((s) => s.status === "live");

            case "past":
                return sessions
                    .filter(
                        (s) =>
                            s.status === "ended" ||
                            (s.status === "scheduled" && new Date(s.scheduledEnd) < now),
                    )
                    .sort((a, b) => new Date(b.scheduledStart) - new Date(a.scheduledStart));

            default:
                return sessions;
        }
    };

    const getSessionStatusBadge = (session) => {
        const now = new Date();
        const start = new Date(session.scheduledStart);

        if (session.status === "live") {
            return (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    ĐANG LIVE
                </span>
            );
        } else if (
            session.status === "ended" ||
            (session.status === "scheduled" && new Date(session.scheduledEnd) < now)
        ) {
            return (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    Đã kết thúc
                </span>
            );
        } else {
            const timeUntil = getTimeUntilSession(session.scheduledStart);
            if (timeUntil && start - now < 30 * 60 * 1000) {
                return (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full flex items-center gap-1">
                        <AlertCircle size={12} />
                        Sắp bắt đầu
                    </span>
                );
            }
            return (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    Sắp tới
                </span>
            );
        }
    };

    if (isLoadingSession) return;
    console.log(sessions);
    const filteredSessions = getFilteredSessions();

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200">
                    <TvMinimalPlay size={18} />
                    <span className="text-sm font-medium">Buổi học live</span>
                </button>
            </SheetTrigger>
            <SheetContent
                aria-describedby={undefined}
                side="right"
                className="w-[60vw] px-5 lg:max-w-3xl max-h-screen overflow-y-auto"
            >
                <SheetHeader className={"relative"}>
                    <SheetTitle className="self-center text-2xl text-[#098be4]">
                        Lịch học trực tiếp
                    </SheetTitle>
                </SheetHeader>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter("upcoming")}
                        className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                            filter === "upcoming"
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <Calendar size={16} />
                        Sắp tới
                    </button>
                    <button
                        onClick={() => setFilter("live")}
                        className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                            filter === "live"
                                ? "bg-red-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <Video size={16} />
                        Đang live
                    </button>
                    <button
                        onClick={() => setFilter("past")}
                        className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                            filter === "past"
                                ? "bg-gray-600 text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <CheckCircle size={16} />
                        Đã kết thúc
                    </button>
                </div>

                {/* Sessions List */}
                {filteredSessions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-md">
                        <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4">
                            {filter === "upcoming" && "Không có buổi học sắp tới"}
                            {filter === "live" && "Không có buổi học nào đang diễn ra"}
                            {filter === "past" && "Chưa có buổi học nào đã kết thúc"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredSessions.map((session) => {
                            const timeUntil = getTimeUntilSession(session.scheduledStart);

                            return (
                                <div
                                    key={session._id}
                                    className="bg-white rounded-md shadow hover:shadow-lg transition-shadow px-4 py-5 border"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            {/* Session name */}
                                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                                {session.sessionName}
                                            </h3>

                                            {/* Time and status */}
                                            <div className="flex flex-wrap items-center gap-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar size={16} />
                                                    <span className="text-sm">
                                                        {formatDate(session.scheduledStart)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Clock size={16} />
                                                    <span className="text-sm">
                                                        {new Date(session.scheduledEnd).getTime() -
                                                            new Date(
                                                                session.scheduledStart,
                                                            ).getTime() >
                                                        0
                                                            ? `${Math.floor((new Date(session.scheduledEnd) - new Date(session.scheduledStart)) / (1000 * 60))} phút`
                                                            : "N/A"}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Users size={16} />
                                                    <span className="text-sm">
                                                        {session.participants?.length || 0} người đã
                                                        tham gia
                                                    </span>
                                                </div>

                                                {getSessionStatusBadge(session)}
                                            </div>

                                            {/* Time until session (if upcoming) */}
                                            {timeUntil && session.status !== "live" && (
                                                <p className="text-sm text-blue-600 font-medium">
                                                    ⏰ {timeUntil}
                                                </p>
                                            )}

                                        </div>

                                        {/* Action Button */}
                                        <div className="ml-4">
                                            {session.status === "live" && (
                                                <button
                                                    onClick={() =>
                                                        navigate(`/student/sessions/prejoin/${session._id}`)
                                                    }
                                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2 animate-pulse"
                                                >
                                                    <Play size={20} />
                                                    Tham gia ngay
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

export default LiveSessionsSheet;
