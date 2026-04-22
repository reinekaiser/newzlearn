import {
    useGenerateUploadUrlMutation,
    useUpdateCurriculumItemMutation,
} from "@/redux/api/sectionApiSlice";
import { useState, useRef } from "react";
import { IoClose } from "react-icons/io5";
import axios from "axios";

const LectureResources = ({ handleClose, courseId, sectionId, itemId }) => {
    const [activeTab, setActiveTab] = useState("file");
    const [file, setFile] = useState(null);
    const [externalTitle, setExternalTitle] = useState("");
    const [externalUrl, setExternalUrl] = useState("");

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
    };

    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const controllerRef = useRef(null);

    const [generateUploadURL] = useGenerateUploadUrlMutation();
    const [updateLecture] = useUpdateCurriculumItemMutation();
    const handleUploadFile = async () => {
        if (!file) return alert("Vui lòng chọn file!");

        setIsUploading(true);
        const controller = new AbortController();
        controllerRef.current = controller;
        try {
            const { uploadURL, s3Key, publicURL } = await generateUploadURL({
                courseId,
                type: "lecture-resource",
                fileName: file.name,
                contentType: file.type,
            }).unwrap();

            await axios.put(uploadURL, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (e) => {
                    setProgress(Math.round((e.loaded * 100) / e.total));
                },
                signal: controller.signal,
            });

            await updateLecture({
                courseId,
                sectionId,
                itemId,
                data: {
                    itemType: "Lecture",
                    resource: {
                        type: "file",
                        s3Key: s3Key,
                        publicURL: publicURL,
                        fileName: file.name,
                    },
                },
            }).unwrap();

            setFile(null);
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
            handleClose();
        }
    };

    const handleAddLink = async () => {
        await updateLecture({
            courseId,
            sectionId,
            itemId,
            data: {
                itemType: "Lecture",
                resource: {
                    type: "url",
                    urlTitle: externalTitle,
                    url: externalUrl,
                },
            },
        }).unwrap();
        handleClose();
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
            <div className="border-r border-l border-b rounded-b border-gray-300 bg-white p-2">
                <div className="border-b mb-4 flex gap-2">
                    {[
                        { key: "file", label: "File tải xuống" },
                        { key: "external", label: "Tài nguyên bên ngoài" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            className={`py-2 font-medium transition-colors ${
                                activeTab === tab.key
                                    ? "border-b-2 border-primary text-primary"
                                    : "border-b-2 border-transparent text-gray-500"
                            }`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <button
                        className="p-1 hover:bg-gray-200 rounded ml-auto h-fit"
                        onClick={handleClose}
                    >
                        <IoClose size={20}></IoClose>
                    </button>
                </div>

                {activeTab === "file" && (
                    <div>
                        <label className="flex items-center gap-4 mt-4 cursor-pointer">
                            <div className="flex-1 border rounded px-3 py-[6px] text-gray-500">
                                {file ? file.name : "Chưa có file được chọn"}
                            </div>
                            <div className="px-4 py-[6px] border border-primary text-primary rounded cursor-pointer">
                                Chọn file
                                <input type="file" onChange={handleFileChange} hidden />
                            </div>
                        </label>
                        <p className="text-[10px] text-gray-500 mt-2">
                            <strong>Chủ thích:</strong> Tài nguyên có thể là bất kỳ loại tài liệu
                            nào có thể được sử dụng để trợ giúp sinh viên trong bài giảng.Đảm bảo
                            mọi thứ đều dễ đọc và kích thước tệp nhỏ hơn 1 GiB
                        </p>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleUploadFile}
                                className="cursor-pointer px-2 py-1 text-white rounded bg-primary"
                            >
                                Thêm file
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "external" && (
                    <div className="space-y-2">
                        <div className="flex flex-col gap-2">
                            <label>Tiêu đề</label>
                            <input
                                type="text"
                                placeholder="Nhập tiêu đề mô tả"
                                value={externalTitle}
                                onChange={(e) => setExternalTitle(e.target.value)}
                                className="border border-gray-300 rounded w-full p-2"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label>URL</label>
                            <input
                                type="url"
                                placeholder="https://example.com/resource"
                                value={externalUrl}
                                onChange={(e) => setExternalUrl(e.target.value)}
                                className="border border-gray-300 rounded w-full p-2"
                            />
                        </div>
                        <div className="mt-4 text-right">
                            <button
                                onClick={handleAddLink}
                                className="cursor-pointer px-2 py-1 text-white rounded bg-primary"
                            >
                                Thêm link
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LectureResources;
