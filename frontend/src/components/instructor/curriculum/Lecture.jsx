import { useState, useRef } from "react";
import { FaRegTrashAlt, FaRegFileAlt } from "react-icons/fa";
import { LuPlus, LuPencil } from "react-icons/lu";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { MdOutlineDragIndicator } from "react-icons/md";
import { MdOutlineArticle } from "react-icons/md";
import DOMPurify from "dompurify";
import axios from "axios";
import LectureResources from "./LectureResources";
import {
    useDeleteCurriculumItemMutation,
    useDeleteFileFromS3Mutation,
    useGenerateUploadUrlMutation,
    useUpdateCurriculumItemMutation,
} from "@/redux/api/sectionApiSlice";
import ArticleEditor from "./ArticleEditor";
import { IoClose } from "react-icons/io5";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { estimateReadingTime, formatTimeShort, generateThumbnailFromVideo } from "@/utils";
import LectureResourceList from "./LectureResourceList";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
import LectureQuestion from "@/components/instructor/curriculum/LectureQuestion";

const Lecture = ({
    item,
    sectionOrder,
    lectureOrder,
    sectionId,
    courseId,
    dragHandleProps,
    style,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [lectureTitle, setLectureTitle] = useState(item.title);
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    const [isCourseInfoOpen, setIsCourseInfoOpen] = useState(false);
    const [lectureDescription, setLectureDescription] = useState(item.description || "");
    const [isAddingLectureDescription, setIsAddingLectureDescription] = useState(false);
    const [isAddingResource, setIsAddingResource] = useState(false);

    const [isEditingArticleLecture, setIsEditingArticleLecture] = useState(false);
    const [textArticle, setTextArticle] = useState(item.content?.text);

    const [isEditingVideoLecture, setIsEditingVideoLecture] = useState(false);
    const [file, setFile] = useState(null);
    const [videoDuration, setVideoDuration] = useState(null);

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

    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const controllerRef = useRef(null);

    const [generateUploadURL] = useGenerateUploadUrlMutation();
    const [deleteFileFromS3] = useDeleteFileFromS3Mutation();

    const [updateLecture] = useUpdateCurriculumItemMutation();

    const handleUpdateVideoLecture = async () => {
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

            await deleteFileFromS3({ s3Key: item.content.s3Key });
            await updateLecture({
                courseId,
                sectionId,
                itemId: item._id,
                data: {
                    itemType: "Lecture",
                    content: {
                        s3Key: videoUploadData.s3Key,
                        publicURL: videoUploadData.publicURL,
                        thumbnailS3Key: thumbnailUploadData.s3Key,
                        thumbnailURL: thumbnailUploadData.publicURL,
                        duration: videoDuration,
                        fileName: file.name,
                    },
                },
            }).unwrap();

            setFile(null);
            setIsEditingVideoLecture(false);
            setIsCourseInfoOpen(!isCourseInfoOpen);
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

    const [isDeleteLectureModalOpen, setIsDeleteLectureModalOpen] = useState(false);
    const [deleteLecture, { isLoading: isDeletingLecture }] = useDeleteCurriculumItemMutation();
    const handleDeleteLecture = async () => {
        await deleteLecture({
            courseId,
            sectionId,
            itemId: item._id,
        }).unwrap();
        setIsDeleteLectureModalOpen(false);
    };
    return (
        <div style={style}>
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
            <div
                {...dragHandleProps}
                className={`cursor-grab active:cursor-grabbing border border-gray-300 p-3 ${isCourseInfoOpen ||
                        isAddingResource ||
                        isEditingArticleLecture ||
                        isEditingVideoLecture
                        ? "rounded-t"
                        : "rounded"
                    } bg-white`}
            >
                {!isEditingTitle ? (
                    <div
                        className="flex items-center relative"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        <span>
                            Bài học {sectionOrder}.{lectureOrder}: {lectureTitle}
                        </span>
                        <div
                            className={`ml-2 flex items-center gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"
                                }`}
                        >
                            <button
                                className="p-1 hover:bg-gray-200 rounded"
                                onClick={() => {
                                    setIsEditingTitle(true);
                                    setIsHovered(false);
                                    setIsCourseInfoOpen(false);
                                    setIsAddingLectureDescription(false);
                                }}
                            >
                                <LuPencil size={15} className="" />
                            </button>
                            <button
                                onClick={() => setIsDeleteLectureModalOpen(true)}
                                className="p-1 hover:bg-gray-200 rounded"
                            >
                                <FaRegTrashAlt size={15} className="" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex">
                                <div
                                    onClick={() => setIsCourseInfoOpen(!isCourseInfoOpen)}
                                    className={`p-1 w-6 h-6 hover:bg-gray-200 rounded ${isAddingResource ||
                                            isEditingArticleLecture ||
                                            isEditingVideoLecture
                                            ? "opacity-0"
                                            : "opacity-100"
                                        }`}
                                >
                                    {isCourseInfoOpen ? (
                                        <IoIosArrowUp></IoIosArrowUp>
                                    ) : (
                                        <IoIosArrowDown></IoIosArrowDown>
                                    )}
                                </div>
                                <MdOutlineDragIndicator
                                    className={`p-1 w-6 h-6 hover:bg-gray-200 rounded ${isHovered ? "opacity-100" : "opacity-0"
                                        }`}
                                ></MdOutlineDragIndicator>
                            </div>
                        </div>
                        <Dialog
                            open={isDeleteLectureModalOpen}
                            onOpenChange={setIsDeleteLectureModalOpen}
                        >
                            <DialogContent className={"min-w-[500px] gap-1 p-0"}>
                                <DialogHeader className={"p-4 pb-0"}>
                                    <DialogTitle className={"mb-0"}>Xác nhận</DialogTitle>
                                </DialogHeader>
                                <p className="px-4 mt-4">
                                    Bạn sắp xóa một bài giảng. Bạn có chắc chắn muốn tiếp tục không?
                                </p>
                                <DialogFooter className={"p-4"}>
                                    <button
                                        onClick={() => setIsDeleteLectureModalOpen(false)}
                                        className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50 "
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        disabled={isDeletingLecture}
                                        onClick={handleDeleteLecture}
                                        className={`px-4 py-1 bg-primary text-white rounded hover:bg-primary/70 font-medium ${isDeletingLecture ? "opacity-60" : ""
                                            }`}
                                    >
                                        {isDeletingLecture ? "Đang xóa" : "OK"}
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center">
                            <span>Bài giảng: </span>
                            <div className="flex-1 space-y-3 ml-2">
                                <input
                                    autoFocus
                                    onChange={(e) => setLectureTitle(e.target.value)}
                                    value={lectureTitle}
                                    className="w-full border focus:border-primary border-gray-300 rounded px-2 py-[6px]"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-3">
                            <button
                                onClick={() => {
                                    setIsEditingTitle(false);
                                }}
                                className="font-medium hover:bg-gray-200 py-1 px-2 rounded"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={async () => {
                                    await updateLecture({
                                        courseId,
                                        sectionId,
                                        itemId: item._id,
                                        data: {
                                            itemType: "Lecture",
                                            title: lectureTitle,
                                        },
                                    }).unwrap();
                                    setIsEditingTitle(false);
                                }}
                                className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isCourseInfoOpen && (
                <div className="border-l border-b border-r border-gray-300 rounded-b p-2 bg-white flex flex-col ">
                    {item.content && item.type === "video" && (
                        <div className="flex gap-2">
                            <img
                                src={item.content.thumbnailURL}
                                className="w-[120px] object-cover border-[1.5px] border-gray-300 "
                            ></img>
                            <div className="flex flex-col gap-[1px] cursor-pointer">
                                <p>{item.content.fileName}</p>
                                <span>{formatTimeShort(item.content.duration)}</span>
                                <div
                                    onClick={() => {
                                        setIsEditingVideoLecture(true);
                                        setIsCourseInfoOpen(!isCourseInfoOpen);
                                    }}
                                    className="flex items-center text-primary gap-1"
                                >
                                    <button className="p-">
                                        <LuPencil size={15} className="" />
                                    </button>
                                    <span>Sửa nội dung</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {item.content && item.type === "article" && (
                        <div className="flex gap-2">
                            <div className="bg-gray-900 w-[120px] h-[60px] flex justify-center overflow-hidden">
                                <MdOutlineArticle className="w-[80px] h-[80px] text-white text-sm"></MdOutlineArticle>
                            </div>
                            <div className="flex flex-col gap-[1px] cursor-pointer">
                                <span>{formatTimeShort(item.content.duration)}</span>
                                <div
                                    onClick={() => {
                                        setIsEditingArticleLecture(true);
                                        setIsCourseInfoOpen(!isCourseInfoOpen);
                                    }}
                                    className="flex items-center text-primary gap-1"
                                >
                                    <button className="p-">
                                        <LuPencil size={15} className="" />
                                    </button>
                                    <span>Sửa nội dung</span>
                                </div>
                            </div>
                        </div>
                    )}
                    {isAddingLectureDescription ? (
                        <div className="py-2 mt-2">
                            <p>Mô tả bài giảng</p>
                            <div className="rounded-[6px] mt-2">
                                <SimpleEditor value={lectureDescription} onChange={setLectureDescription} placeholder={"Nhập mô tả bài giảng"} mention={null} type="basic"></SimpleEditor>
                            </div>
                            <div className="flex justify-end gap-3 mt-3">
                                <button
                                    onClick={() => {
                                        setIsAddingLectureDescription(false);
                                    }}
                                    className="font-medium hover:bg-gray-200 py-1 px-2 rounded"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => {
                                        console.log(lectureDescription);
                                        updateLecture({
                                            courseId,
                                            sectionId,
                                            itemId: item._id,
                                            data: {
                                                itemType: "Lecture",
                                                description: lectureDescription.replace(
                                                    /<(.|\n)*?>/g,
                                                    ""
                                                ),
                                            },
                                        });
                                        setIsAddingLectureDescription(false);
                                    }}
                                    className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    ) : item.description && !isAddingLectureDescription ? (
                        <div className="border-t pt-2 mt-2 border-gray-300">
                            <div className="flex items-center gap-2 border px-2 py-1 border-transparent hover:border-gray-300 cursor-pointer">
                                <p className="font-semibold ">Mô tả bài giảng: </p>
                                <div
                                    onClick={() => setIsAddingLectureDescription(true)}
                                    className="prose max-w-none"
                                    dangerouslySetInnerHTML={{
                                        __html: DOMPurify.sanitize(lectureDescription),
                                    }}
                                />
                            </div>
                        </div>
                    ) : (
                        <></>
                    )}
                    {item.type === "video" && (
                        <div>
                            <LectureQuestion itemId={item._id} item={item} sectionId={sectionId} courseId={courseId} />
                        </div>
                    )}

                    {/* Lecture Resource List */}
                    {item.resources.length > 0 && (
                        <LectureResourceList
                            resources={item.resources}
                            sectionId={sectionId}
                            lectureId={item._id}
                        ></LectureResourceList>
                    )}
                    <div className="border-t py-2 space-y-3 mt-2">
                        {!item.description && (
                            <button
                                onClick={() => setIsAddingLectureDescription(true)}
                                className="border cursor-pointer rounded px-3 py-1 text-primary font-semibold flex items-center gap-2 w-fit"
                            >
                                <LuPlus size={16}></LuPlus> Mô tả
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setIsAddingResource(true);
                                setIsCourseInfoOpen(false);
                            }}
                            className="border cursor-pointer rounded px-3 py-1 text-primary font-semibold flex items-center gap-2 w-fit"
                        >
                            <LuPlus size={16}></LuPlus> Tài nguyên
                        </button>
                    </div>
                </div>
            )}
            {isEditingArticleLecture && (
                <div className="border-r border-l border-b rounded-b border-gray-300 bg-white p-2">
                    <div className="flex justify-between items-center pb-1">
                        <span>Nội dung</span>
                        <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={() => {
                                setIsEditingArticleLecture(false);
                                setIsCourseInfoOpen(!isCourseInfoOpen);
                            }}
                        >
                            <IoClose size={20}></IoClose>
                        </button>
                    </div>
                    <ArticleEditor
                        content={textArticle}
                        setContent={setTextArticle}
                    ></ArticleEditor>
                    <div className="flex justify-end gap-3 mt-3">
                        <button
                            onClick={async () => {
                                await updateLecture({
                                    courseId,
                                    sectionId,
                                    itemId: item._id,
                                    data: {
                                        itemType: "Lecture",
                                        content: {
                                            text: textArticle,
                                            duration: estimateReadingTime(textArticle),
                                        },
                                    },
                                }).unwrap();
                                setIsEditingArticleLecture(false);
                                setIsCourseInfoOpen(!isCourseInfoOpen);
                            }}
                            className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            )}
            {isEditingVideoLecture && (
                <div className="border-r border-l border-b rounded-b border-gray-300 bg-white p-2">
                    <div className="p-2 rounded border border-gray-300 mt-1">
                        <div className="flex justify-between items-center border-b pb-2 ">
                            <div className="flex gap-6">
                                <button className="border-b-2 border-primary">Tải lên video</button>
                            </div>
                            <button
                                className="p-1 hover:bg-gray-200 rounded"
                                onClick={() => {
                                    setIsEditingVideoLecture(false);
                                    setFile(null);
                                    setIsCourseInfoOpen(!isCourseInfoOpen);
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
                            <strong>Chủ thích:</strong> Tất cả các file tối thiểu là 720p và ít hơn
                            4.0 GB.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3 mt-3">
                        <button
                            onClick={handleUpdateVideoLecture}
                            className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            )}
            {isAddingResource && (
                <LectureResources
                    handleClose={() => {
                        setIsAddingResource(false);
                        setIsCourseInfoOpen(true);
                    }}
                    sectionId={sectionId}
                    courseId={courseId}
                    itemId={item._id}
                ></LectureResources>
            )}
        </div>
    );
};

export default Lecture;
