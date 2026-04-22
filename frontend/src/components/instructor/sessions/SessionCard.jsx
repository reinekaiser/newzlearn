import { useState } from "react";
import { Calendar, Clock, Users, Play, Edit, Trash2, BookOpen, Video, AlertCircle, CheckCircle } from "lucide-react";
import SessionModal from "./SessionModal";
import { useNavigate } from "react-router-dom";
const SessionCard = ({ session, courses }) => {
    const navigate = useNavigate();

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
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
        } else if (session.status === "ended") {
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

    const [openUpdateModal, setOpenUpdateModal] = useState(false);
    const timeUntil = getTimeUntilSession(session.scheduledStart);
    return (
        <div
            key={session._id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow px-5 py-4 border"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    {/* Course name */}
                    <div className="flex gap-4 items-baseline">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-600">{session.course?.title}</span>
                        </div>
                        <div className="">
                            <SessionModal
                                open={openUpdateModal}
                                onOpenChange={setOpenUpdateModal}
                                sessionData={session}
                                mode="edit"
                                trigger={
                                    <button className="p-2 hover:bg-gray-300 rounded">
                                        <Edit size={16}></Edit>
                                    </button>
                                }
                                courses={courses}
                            ></SessionModal>
                            <button className="p-2 hover:bg-gray-300 rounded">
                                <Trash2 size={16}></Trash2>
                            </button>
                        </div>
                    </div>

                    {/* Session name */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {session.sessionName}
                    </h3>

                    {/* Time and status */}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Calendar size={16} />
                            <span className="text-sm">{formatDate(session.scheduledStart)}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock size={16} />
                            <span className="text-sm">
                                {new Date(session.scheduledEnd).getTime() -
                                    new Date(session.scheduledStart).getTime() >
                                0
                                    ? `${Math.floor((new Date(session.scheduledEnd) - new Date(session.scheduledStart)) / (1000 * 60))} phút`
                                    : "N/A"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <Users size={16} />
                            <span className="text-sm">
                                {session.participants?.length || 0} người đã tham gia
                            </span>
                        </div>

                        {getSessionStatusBadge(session)}
                    </div>

                    {/* Time until session (if upcoming) */}
                    {timeUntil && session.status !== "live" && (
                        <p className="text-sm text-blue-600 font-medium">{timeUntil}</p>
                    )}
                </div>

                {/* Action Button */}
                <div className="flex gap-2">
                    <div className="">
                        {session.status === "live" ? (
                            <button
                                onClick={() => navigate(`prejoin/${session._id}`)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 animate-pulse"
                            >
                                <Play size={20} />
                                Tham gia ngay
                            </button>
                        ) : session.status === "ended" ? (
                            <button
                                onClick={() => navigate(`prejoin/${session._id}`)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                                <Video size={20} />
                                Bắt đầu lại
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate(`prejoin/${session._id}`)}
                                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
                            >
                                <Video size={20} />
                                Tham gia ngay
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default SessionCard;
