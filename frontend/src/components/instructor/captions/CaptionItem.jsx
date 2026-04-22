import { useAddCaptionMutation, useDeleteCaptionMutation } from "@/redux/api/courseApiSlice";
import { useGenerateUploadUrlMutation } from "@/redux/api/sectionApiSlice";
import axios from "axios";
import { Check } from "lucide-react";
import { useState, useRef } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsThreeDotsVertical } from "react-icons/bs";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import CaptionEditModal from "./CaptionEditModal";
import { nanoid } from "nanoid";
import { BASE_URL } from "@/redux/constants";

const CaptionItem = ({ item, courseId, courseAlias, language }) => {
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const controllerRef = useRef(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [generateUploadURL] = useGenerateUploadUrlMutation();
    const handleUploadFile = async (e, item) => {
        const selectedFile = e.target.files[0];
        console.log(selectedFile);
        if (!selectedFile) return;

        console.log("File selected:", selectedFile.name);

        const isValidFile = validateFile(selectedFile);
        if (!isValidFile) {
            e.target.value = "";
            return;
        }

        await uploadFile(selectedFile, e, item);
    };

    const validateFile = (file) => {
        if (!file.name.toLowerCase().endsWith(".vtt")) {
            return false;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return false;
        }

        return true;
    };

    const uploadFile = async (file, e, item) => {
        setIsUploading(true);
        setProgress(0);

        const controller = new AbortController();
        controllerRef.current = controller;

        try {
            // 1. Lấy URL upload từ API
            const { uploadURL, s3Key, publicURL } = await generateUploadURL({
                courseId,
                type:
                    item.itemType === "promoVideo"
                        ? `course-promo-video/captions/${language}`
                        : `lecture-video/captions/${language}`,
                fileName: file.name,
                contentType: file.type,
            }).unwrap();

            // 2. Upload lên S3
            await axios.put(uploadURL, file, {
                headers: {
                    "Content-Type": file.type,
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        setProgress(percentCompleted);
                    }
                },
                signal: controller.signal,
            });

            const captionData = {
                videoType: item.itemType,
                itemId: item._id,
                caption: {
                    s3Key,
                    publicURL,
                    language,
                    status: "uploaded",
                },
            };

            await addCaption({ courseAlias, caption: captionData });
        } catch (error) {
            if (axios.isCancel(error)) {
                console.error("Hủy upload");
            } else {
                console.error("Lỗi upload:", error);
                alert("Lỗi upload: " + error.message);
            }
        } finally {
            // Reset input file
            e.target.value = "";
            setIsUploading(false);
            setProgress(0);
        }
    };

    const handleDownload = async (item) => {
        try {
            const caption = item.content.captions.find((cap) => cap.language === language);
            const res = await axios.get(`${BASE_URL}/api/downloadResources`, {
                params: { key: caption.s3Key },
            });

            const { downloadURL } = res.data;
            const response = await fetch(downloadURL);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = `${nanoid(10)}.vtt`;
            link.click();

            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download error:", error);
        }
    };

    const [addCaption] = useAddCaptionMutation();
    const [deleteCaption, { isLoading: isDeletingCaption }] = useDeleteCaptionMutation();

    const handleConfirmDelete = async (item) => {
        try {
            const caption = item.content.captions.find((cap) => cap.language === language);
            await deleteCaption({
                courseAlias,
                videoType: item.itemType,
                itemId: item._id,
                caption,
            }).unwrap();

            setIsDeleteModalOpen(false);
        } catch (err) {
            console.log(err);
            toast.error("Lỗi khi xóa", {
                position: "top-right",
                autoClose: 2000,
            });
        }
    };

    return (
        <div>
            {isUploading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-[9999]">
                    <div className="flex flex-col items-center justify-center -translate-y-[50%]">
                        <div className="text-white mb-2">Đang tải file lên...</div>
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
                                    if (controllerRef.current) {
                                        controllerRef.current.abort();
                                    }
                                }}
                                className="text-gray-300 cursor-pointer p-1 pointer-events-auto"
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div className="flex items-center gap-3 w-[50%]">
                    {item.captionStatus !== "Chưa có phụ đề" ? (
                        <span className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                        </span>
                    ) : (
                        <span className="w-4 h-4 border border-gray-400 rounded-full"></span>
                    )}
                    <span className="line-clamp-1">{item.title}</span>
                </div>

                <div className="flex items-center justify-between flex-1 gap-4 text text-gray-600">
                    {item.captionStatus}
                    {item.captionStatus !== "Chưa có phụ đề" ? (
                        <div className="flex gap-[2px]">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="px-3 py-1 min-w-[84px] cursor-pointer border border-primary text-primary rounded hover:bg-primary/10 transition"
                            >
                                Sửa
                            </button>
                            <CaptionEditModal
                                courseId={courseId}
                                language={language}
                                caption={item}
                                isOpen={isEditModalOpen}
                                onOpenChange={setIsEditModalOpen}
                            ></CaptionEditModal>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-[1px] py-2 cursor-pointer text-primary/70 h-full hover:bg-primary/20 rounded">
                                        <BsThreeDotsVertical />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                        <label className="cursor-pointer">
                                            Tải lên
                                            <input
                                                type="file"
                                                accept=".vtt,text/vtt,video/webvtt"
                                                onChange={(e) => handleUploadFile(e, item)}
                                                hidden
                                            />
                                        </label>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(item)}>Tải xuống</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setIsDeleteModalOpen(true)}>
                                        Xóa
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                                <DialogContent className={"min-w-[500px] gap-1 p-0"}>
                                    <DialogHeader className={"p-4 pb-0"}>
                                        <DialogTitle className={"mb-0"}>Xác nhận</DialogTitle>
                                    </DialogHeader>
                                    <p className="px-4 mt-4">
                                        Bạn sắp xóa một phụ đề. Bạn có chắc chắn muốn tiếp tục
                                        không?
                                    </p>
                                    <DialogFooter className={"p-4"}>
                                        <button
                                            disabled={isDeletingCaption}
                                            onClick={() => setIsDeleteModalOpen(false)}
                                            className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50 "
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            disabled={isDeletingCaption}
                                            onClick={() => handleConfirmDelete(item)}
                                            className="px-4 py-1 bg-primary text-white rounded hover:bg-primary/70 font-medium"
                                        >
                                            OK
                                        </button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    ) : (
                        <label className="px-3 py-1 text-center min-w-[84px] border border-primary text-primary rounded hover:bg-primary/10 transition mr-5">
                            Tải lên
                            <input
                                type="file"
                                accept=".vtt,text/vtt,video/webvtt"
                                onChange={(e) => handleUploadFile(e, item)}
                                hidden
                            />
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CaptionItem;
