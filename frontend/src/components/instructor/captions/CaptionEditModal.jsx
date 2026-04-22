import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Save, X, Check } from "lucide-react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import VideoPlayer from "@/components/student/course-learning/VideoPlayer";
import { useGetCaptionContentQuery, useUpdateCaptionMutation } from "@/redux/api/courseApiSlice";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "react-toastify";

const CaptionEditModal = ({ courseId, caption, isOpen, onOpenChange, language }) => {
    const { data, isLoading: isLoadingContent } = useGetCaptionContentQuery({
        courseId: courseId,
        lectureId: caption.itemType === "lectureVideo" ? caption._id : "1",
        language,
        itemType: caption.itemType,
    });

    const [dialogKey, setDialogKey] = useState(0);

    const handleOpenChange = (open) => {
        onOpenChange(open);
        if (!open) {
            // Khi đóng dialog, tăng key để reset component
            setDialogKey((prev) => prev + 1);
            setCurrentTime(0);
            setEditingId(null);
        }
    };

    const [updateCaption, { isLoading: isUpdatingCaption, isSuccess: isUpdateCaptionSuccess }] =
        useUpdateCaptionMutation();

    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [captions, setCaptions] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const captionListRef = useRef(null);
    const captionRefs = useRef({});

    useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => {
            if (videoRef.current) {
                setCurrentTime(videoRef.current.getCurrentTime());
            }
        }, 1000);
        console.log(currentTime);
        return () => clearInterval(interval);
    }, [isPlaying]);

    useEffect(() => {
        if (data) {
            setCaptions(data.parsed.map((c, i) => ({ id: i + 1, ...c })));
        }
    }, [data]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${ms}`;
    };

    const getCurrentCaption = () => {
        return captions.find((cap) => currentTime >= cap.start && currentTime <= cap.end);
    };

    const startEditing = (caption) => {
        setEditingId(caption.id);
        setCurrentTime(caption.start);

        console.log(isPlaying)
        if (videoRef.current) {
            videoRef.current.setCurrentTime(caption.start);            
        }

        setTimeout(() => {
            const captionElement = document.getElementById(`caption-${caption.id}`);
            if (captionElement && captionListRef.current) {
                captionElement.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }, 100);
    };

    const updateText = (id, newText) => {
        setCaptions((prev) => prev.map((cap) => (cap.id === id ? { ...cap, text: newText } : cap)));
    };

    const saveAllCaptions = async () => {
        console.log("Saving captions:", captions);
        try {
            await updateCaption({
                courseId: courseId,
                lectureId: caption.itemType === "lectureVideo" ? caption._id : "1",
                language,
                itemType: caption.itemType,
                captions,
            }).unwrap();
            toast.success("Cập nhật phụ đề thành công!");
        } catch (error) {
            console.log(error);
            toast.error("Cập nhật phụ đề thất bại!");
        }
    };

    const currentCaption = getCurrentCaption();

    if (isLoadingContent) {
        return <div></div>;
    }

    return (
        <Dialog modal={false} open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                onInteractOutside={(e) => {
                    e.preventDefault();
                }}
                key={dialogKey}
                className={
                    "fixed inset-0 w-screen h-screen sm:max-w-none max-h-none transform-none rounded-none p-0 translate-0 [&>button]:hidden"
                }
            >
                {isUpdatingCaption && (
                    <div className="absolute flex h-screen w-screen bg-white/50 items-center justify-center z-50">
                        <Spinner className="size-12" color="#098ce9" />
                    </div>
                )}
                <div className="">
                    {/* Header */}
                    <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h1 className="text-xl font-bold">{caption.title}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={saveAllCaptions}
                                className="bg-primary text-white min-h-9 w-[70px] flex items-center justify-center rounded hover:bg-primary/70 transition font-medium"
                            >
                                Lưu
                            </button>
                            <DialogClose className="text-gray-600 hover:text-gray-800 cursor-pointer">
                                Thoát
                            </DialogClose>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Main Content Area */}
                        <div className="flex-1 bg-gray-100 p-6 overflow-y-auto">
                            {/* Video Player */}
                            <div className="bg-black rounded-lg overflow-hidden relative mb-6">
                                <VideoPlayer
                                    videoUrl={
                                        caption.content?.hlsURL
                                            ? caption.content?.hlsURL
                                            : caption.content?.publicURL
                                    }
                                    captions={captions}
                                    ref={videoRef}
                                    onPlayStateChange={setIsPlaying}
                                ></VideoPlayer>
                            </div>
                        </div>

                        {/* Right Sidebar - Caption List */}
                        <div className="w-[460px] bg-white border-l h-screen flex flex-col">
                            <div ref={captionListRef} className="flex-1 h-full overflow-y-auto">
                                {captions.map((caption) => (
                                    <div
                                        key={caption.id}
                                        id={`caption-${caption.id}`}
                                        ref={(el) => (captionRefs.current[caption.id] = el)}
                                        className={`border-b relative transition-colors ${
                                            editingId === caption.id
                                                ? "bg-blue-50"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        {currentTime >= caption.start &&
                                            currentTime < caption.end && (
                                                <div className="absolute h-full w-1 bg-primary left-0"></div>
                                            )}
                                        {editingId === caption.id ? (
                                            // Edit Mode
                                            <div className="p-4">
                                                <div className="text-[13px] text-gray-500 mb-2 font-mono">
                                                    {formatTime(caption.start)} →{" "}
                                                    {formatTime(caption.end)}
                                                </div>
                                                <textarea
                                                    value={caption.text}
                                                    onChange={(e) =>
                                                        updateText(caption.id, e.target.value)
                                                    }
                                                    className="w-full p-2 border border-gray-300 bg-white outline-none rounded resize-none"
                                                    rows="2"
                                                    autoFocus
                                                />
                                            </div>
                                        ) : (
                                            // View Mode
                                            <div
                                                onClick={() => startEditing(caption)}
                                                className="p-4 cursor-pointer"
                                            >
                                                <div className="text-[13px] text-gray-500 mb-2 font-mono">
                                                    {formatTime(caption.start)} →{" "}
                                                    {formatTime(caption.end)}
                                                </div>
                                                <div className="text-sm text-gray-800 leading-relaxed">
                                                    {caption.text}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CaptionEditModal;
