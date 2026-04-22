import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { useState, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { FaCirclePlay } from "react-icons/fa6";
import { FaRegFileAlt } from "react-icons/fa";
import ArticleEditor from "./ArticleEditor";
import axios from "axios";
import {
    useAddLectureToSectionMutation,
    useGenerateUploadUrlMutation,
} from "@/redux/api/sectionApiSlice";
import { estimateReadingTime, generateThumbnailFromVideo } from "@/utils";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";

const LectureModal = ({ open, onOpenChange, courseId, sectionId }) => {
    const [showContentType, setShowContentType] = useState(true);
    const [contentType, setContentType] = useState(null);

    const [videoDuration, setVideoDuration] = useState(null);

    const handleSelectContent = (type) => {
        setContentType(type);
        setShowContentType(false);
    };

    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
            setVideoDuration(video.duration);
            window.URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(selectedFile);
    };

    const [lectureTitle, setLectureTitle] = useState("");
    const [lectureDescription, setLectureDescription] = useState("");

    const [textArticle, setTextArticle] = useState("");

    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const controllerRef = useRef(null);

    const [generateUploadURL] = useGenerateUploadUrlMutation();

    const [addLectureToSection, { isLoading }] = useAddLectureToSectionMutation();

    const handleCloseLectureModal = (open) => {
        onOpenChange(open);
        if (!open) {
            setLectureTitle("");
            setLectureDescription("");
            setContentType("null");
            setShowContentType(true);
            setFile(null);
        }
        if (contentType === "article") {
            setTextArticle("");
        }
    };

    const handleSaveVideoLecture = async (open) => {
        if (!file) return alert("Vui lòng chọn video!");

        setIsUploading(true);
        const controller = new AbortController();
        controllerRef.current = controller;
        try {
            let uploadedBytes = 0;
            let totalBytes = file.size;

            const thumbnailBlob = await generateThumbnailFromVideo(file, 10.0);
            totalBytes += thumbnailBlob.size;

            const [videoUploadData, thumbnailUploadData] = await Promise.all([
                generateUploadURL({
                    courseId,
                    type: "lecture-video",
                    fileName: file.name,
                    contentType: file.type,
                }).unwrap(),
                generateUploadURL({
                    courseId,
                    type: "lecture-thumbnail",
                    fileName: file.name.replace(/\.[^/.]+$/, "_thumbnail.jpg"),
                    contentType: "image/jpeg",
                }).unwrap(),
            ]);

            await axios.put(videoUploadData.uploadURL, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (e) => {
                    const loaded = e.loaded;
                    const currentTotal = uploadedBytes + loaded;
                    setProgress(Math.round((currentTotal / totalBytes) * 100));
                },
                signal: controller.signal,
            });

            uploadedBytes += file.size;

            await axios.put(thumbnailUploadData.uploadURL, thumbnailBlob, {
                headers: { "Content-Type": "image/jpeg" },
                onUploadProgress: (e) => {
                    const loaded = e.loaded;
                    const currentTotal = uploadedBytes + loaded;
                    setProgress(Math.round((currentTotal / totalBytes) * 100));
                },
                signal: controller.signal,
            });

            uploadedBytes += thumbnailBlob.size;

            setProgress(100);
            
            await addLectureToSection({
                courseId,
                sectionId,
                lectureData: {
                    title: lectureTitle,
                    description: lectureDescription.replace(/<(.|\n)*?>/g, "").trim(),
                    type: "video",
                    s3Key: videoUploadData.s3Key,
                    publicURL: videoUploadData.publicURL,
                    thumbnailS3Key: thumbnailUploadData.s3Key,
                    thumbnailURL: thumbnailUploadData.publicURL,
                    duration: videoDuration,
                    fileName: file.name,
                },
            });

            if (!open) {
                setLectureTitle("");
                setLectureDescription("");
                setContentType("null");
                setShowContentType(true);
                setFile(null);
            }
            if (contentType === "article") {
                setTextArticle("");
            }
            onOpenChange(open);
        } catch (error) {
            if (axios.isCancel(error)) {
                console.error("Hủy upload");
            } else {
                console.error("Lỗi upload:", error);
                alert("Lỗi upload: " + error.message);
            }
        } finally {
            setIsUploading(false);
            setProgress(0);
        }
    };

    const handelSaveArticleLecture = async (open) => {
        await addLectureToSection({
            courseId,
            sectionId,
            lectureData: {
                title: lectureTitle,
                description: lectureDescription.replace(/<(.|\n)*?>/g, "").trim(),
                type: "article",
                text: textArticle,
                duration: estimateReadingTime(textArticle),
            },
        });

        if (!open) {
            setLectureTitle("");
            setLectureDescription("");
            setContentType("null");
            setShowContentType(true);
            setFile(null);
        }
        if (contentType === "article") {
            setTextArticle("");
        }

        onOpenChange(open);
    };

    const handleCancelUpload = () => {
        if (controllerRef.current) {
            controllerRef.current.abort();
        }
    };
    return (
        <div>
            {isUploading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-[9999]">
                    <div className="flex flex-col items-center justify-center -translate-y-[50%]">
                        <div className="text-white mb-2">Đang tải video lên...</div>
                        <div className="flex items-center gap-3">
                            <div className="w-[500px] bg-gray-300 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelUpload();
                                }}
                                className="text-gray-300 cursor-pointer p-1 pointer-events-auto"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Dialog open={open} onOpenChange={handleCloseLectureModal} className="">
                <DialogContent
                    className="min-w-[890px] max-h-[550px] overflow-y-auto p-0 gap-0"
                    onPointerDownOutside={(e) => e.preventDefault()}
                >
                    <DialogHeader className={"px-5 py-4 border-b border-gray-300"}>
                        <DialogTitle>Thêm bài giảng mới</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 p-5 ">
                        <div>
                            <label className="block">Tiêu đề</label>
                            <input
                                type="text"
                                value={lectureTitle}
                                onChange={(e) => setLectureTitle(e.target.value)}
                                className="w-full border rounded border-gray-300 px-3 py-2 mt-1 text-sm"
                                placeholder="Nhập tên bài giảng..."
                            />
                        </div>

                        {showContentType && (
                            <div className="">
                                <p className="">Loại bài học</p>
                                <div className="flex items-center justify-center gap-3">
                                    <div
                                        className="border border-gray-300 rounded hover:bg-gray-100 flex items-center flex-col"
                                        onClick={() => handleSelectContent("video")}
                                    >
                                        <div className="py-3 px-6">
                                            <FaCirclePlay className="h-[30px] w-[30px]" />
                                        </div>
                                        <div className="text-[12px] bg-gray-200 w-full text-center">
                                            Video
                                        </div>
                                    </div>

                                    <div
                                        className="border border-gray-300 rounded hover:bg-gray-100 flex items-center flex-col"
                                        onClick={() => handleSelectContent("article")}
                                    >
                                        <div className="py-3 px-6">
                                            <FaRegFileAlt className="h-[30px] w-[30px]" />
                                        </div>
                                        <div className="text-[12px] bg-gray-200 w-full text-center">
                                            Tài liệu
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {contentType === "video" && (
                            <div className="">
                                <p className="">Loại bài học</p>
                                <div className="p-2 rounded border border-gray-300 mt-1">
                                    <div className="flex justify-between items-center border-b pb-2 ">
                                        <div className="flex gap-6">
                                            <button className="border-b-2 border-primary">
                                                Tải lên video
                                            </button>
                                        </div>
                                        <button
                                            className="p-1 hover:bg-gray-200 rounded"
                                            onClick={() => {
                                                setShowContentType(true);
                                                setContentType(null);
                                                setFile(null);
                                            }}
                                        >
                                            <IoClose size={20}></IoClose>
                                        </button>
                                    </div>

                                    <label className="flex items-center gap-4 mt-4 cursor-pointer">
                                        <div className="flex-1 border rounded px-3 py-[6px] text-gray-500">
                                            {file ? file.name : "Chưa có file được chọn"}
                                        </div>
                                        <div className="px-4 py-[6px] bg-primary text-white rounded cursor-pointer">
                                            Chọn video
                                            <input
                                                type="file"
                                                accept="video/*"
                                                onChange={handleFileChange}
                                                hidden
                                            />
                                        </div>
                                    </label>

                                    <p className="text-xs text-gray-500 mt-2">
                                        <strong>Chủ thích:</strong> Tất cả các file tối thiểu là
                                        720p và ít hơn 4.0 GB.
                                    </p>
                                </div>
                            </div>
                        )}
                        {contentType === "article" && (
                            <div className="">
                                <p className="">Loại bài học</p>
                                <div className="p-2 rounded border border-gray-300 mt-1">
                                    <div className="flex justify-between items-center pb-1">
                                        <span>Nội dung</span>
                                        <button
                                            className="p-1 hover:bg-gray-200 rounded"
                                            onClick={() => {
                                                setShowContentType(true);
                                                setContentType(null);
                                                setTextArticle("");
                                            }}
                                        >
                                            <IoClose size={20}></IoClose>
                                        </button>
                                    </div>
                                    <ArticleEditor
                                        content={textArticle}
                                        setContent={setTextArticle}
                                    ></ArticleEditor>
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="">
                                <p>Mô tả bài giảng</p>
                                <div className="rounded-[6px] mt-2">
                                    <SimpleEditor value={lectureDescription} onChange={setLectureDescription} placeholder={"Nhập mô tả bài giảng"} mention={null} type="basic"></SimpleEditor>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 px-5 pb-5">
                        <button
                            onClick={() => handleCloseLectureModal(false)}
                            className="hover:bg-gray-300 px-2 py-1 rounded cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            disabled={
                                !(
                                    (file || textArticle.replace(/<(.|\n)*?>/g, "").trim()) &&
                                    lectureTitle
                                )
                            }
                            onClick={() => {
                                if (contentType === "video") {
                                    handleSaveVideoLecture(false);
                                } else if (contentType === "article") {
                                    handelSaveArticleLecture(false);
                                }
                            }}
                            className="bg-primary  cursor-pointer px-2 py-1 rounded text-white disabled:opacity-50 disabled:cursor-default"
                        >
                            Lưu bài giảng
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LectureModal;
