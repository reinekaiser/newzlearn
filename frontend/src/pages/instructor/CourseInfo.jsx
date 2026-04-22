import { useState, useRef, useEffect } from "react";
import ReactQuillNew from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { toast } from "react-toastify";
import {
    useDeleteFileFromS3Mutation,
    useGenerateUploadUrlMutation,
} from "@/redux/api/sectionApiSlice";
import { generateThumbnailFromVideo } from "@/utils";
import { useUpdateCourseMutation } from "@/redux/api/courseApiSlice";
import { Link } from "react-router-dom";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";

// const course = {
//     title: "Demo",
//     category: "IT & Phần mềm",
// };

const LANGUAGE_OPTIONS = [
    { value: "en", label: "Tiếng Anh" },
    { value: "vi", label: "Tiếng Việt" },
];

const LEVEL_OPTIONS = [
    { value: "Beginner", label: "Người mới bắt đầu" },
    { value: "Intermediate", label: "Trung cấp" },
    { value: "Advanced", label: "Nâng cao" },
    { value: "All Levels", label: "Mọi trình độ" },
];

const courseCategories = [
        "Chọn danh mục",
        "Lập trình",
        "Kinh doanh",
        "Thiết kế",
        "Tiếp thị",
        "CNTT & Phần mềm",
        "Phát triển cá nhân",
        "Nhiếp ảnh",
        "Âm nhạc",
    ];


const CourseInfo = ({ course }) => {
    const [formData, setFormData] = useState({
        title: course.title || "",
        subtitle: course.subtitle || "",
        description: course.description || "",
        category: course.category || "",
        price: course.price || "",
        language: course.language || "",
        level: course.level || "",
    });

    const [courseImage, setCourseImage] = useState(course.thumbnail?.publicURL);
    const [existedPromoVideo, setExistedPromoVideo] = useState(course.promoVideo?.publicURL);

    const [courseImageFile, setCourseImageFile] = useState(null);
    const [promoVideo, setPromoVideo] = useState(null);

    const [errors, setErrors] = useState({});

    const [isChanged, setIsChanged] = useState(false);

    const handleChange = (field, value) => {
        if (course) {
            setFormData((prev) => ({
                ...prev,
                [field]: value,
            }));
        }
        console.log("field change", field);
        if (!isChanged) {
            setIsChanged(true);
        }
    };

    const handleQuillChange = (content, delta, source, editor) => {
        setFormData((prev) => ({
            ...prev,
            description: content,
        }));

        if (content.replace(/<(.|\n)*?>/g, "") !== "") {
            if (!isChanged) {
                setIsChanged(true);
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCourseImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setCourseImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
        if (!isChanged) {
            setIsChanged(true);
        }
    };

    const handleVideoChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setPromoVideo(selectedFile);
        if (!isChanged) {
            setIsChanged(true);
        }
    };

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const controllerRef = useRef(null);

    const [generateUploadURL] = useGenerateUploadUrlMutation();
    const [deleteFileFromS3] = useDeleteFileFromS3Mutation();
    const [updateCourse, { isLoading: isUpdatingCourse }] = useUpdateCourseMutation();

    const handleSave = async () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Vui lòng nhập tiêu đề khóa học";
        }
        if (!formData.category.trim()) {
            newErrors.category = "Vui lòng chọn danh mục khóa học";
        }

        if (!formData.description.replace(/<(.|\n)*?>/g, "").trim()) {
            newErrors.description = "Vui lòng nhập mô tả khóa học khóa học";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc!");
            return;
        }

        console.log("form data updated", formData);
        let videoUploadData = null;
        let thumbnailUploadData = null;
        let imageUploadData = null;

        try {
            if (promoVideo || courseImageFile) {
                setIsUploading(true);
                const controller = new AbortController();
                controllerRef.current = controller;

                let uploadedBytes = 0;
                let totalBytes = 0;

                if (promoVideo) totalBytes += promoVideo.size;
                if (courseImageFile) totalBytes += courseImageFile.size;

                let thumbnailBlob;

                if (promoVideo) {
                    thumbnailBlob = await generateThumbnailFromVideo(promoVideo, 1.0);

                    totalBytes += thumbnailBlob.size;

                    [videoUploadData, thumbnailUploadData] = await Promise.all([
                        generateUploadURL({
                            courseId: course._id,
                            type: "course-promo-video",
                            fileName: promoVideo.name,
                            contentType: promoVideo.type,
                        }).unwrap(),
                        generateUploadURL({
                            courseId: course._id,
                            type: "course-promo-thumbnail",
                            fileName: promoVideo.name.replace(/\.[^/.]+$/, "_thumbnail.jpg"),
                            contentType: "image/jpeg",
                        }).unwrap(),
                    ]);

                    await axios.put(videoUploadData.uploadURL, promoVideo, {
                        headers: { "Content-Type": promoVideo.type },
                        onUploadProgress: (e) => {
                            const loaded = e.loaded;
                            const currentTotal = uploadedBytes + loaded;
                            setProgress(Math.round((currentTotal / totalBytes) * 100));
                        },
                        signal: controller.signal,
                    });

                    uploadedBytes += promoVideo.size;

                    // --- Upload thumbnail ---
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
                }

                if (courseImageFile) {
                    imageUploadData = await generateUploadURL({
                        courseId: course._id,
                        type: "course-thumbnail",
                        fileName: courseImageFile.name,
                        contentType: courseImageFile.type,
                    }).unwrap();

                    await axios.put(imageUploadData.uploadURL, courseImageFile, {
                        headers: { "Content-Type": courseImageFile.type },
                        onUploadProgress: (e) => {
                            const loaded = e.loaded;
                            const currentTotal = uploadedBytes + loaded;
                            setProgress(Math.round((currentTotal / totalBytes) * 100));
                        },
                        signal: controller.signal,
                    });

                    uploadedBytes += courseImageFile.size;
                }

                setProgress(100);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                return;
            } else {
                console.error("Lỗi upload:", error);
                alert("Lỗi upload: " + error.message);
            }
        } finally {
            setIsUploading(false);
            setProgress(0);
        }

        if (courseImageFile && course.thumbnail?.s3Key) {
            await deleteFileFromS3({ s3Key: course.thumbnail.s3Key });
        }

        if (promoVideo && course.promoVideo?.s3Key) {
            await deleteFileFromS3({ s3Key: course.promoVideo.s3Key });
            await deleteFileFromS3({ s3Key: course.promoVideo.thumbnailS3Key });
        }

        await updateCourse({
            courseAlias: course.alias,
            data: {
                ...formData,
                ...(promoVideo && {
                    promoVideo: {
                        publicURL: videoUploadData.publicURL,
                        s3Key: videoUploadData.s3Key,
                        thumbnailURL: thumbnailUploadData.publicURL,
                        thumbnailS3Key: thumbnailUploadData.s3Key,
                    },
                }),
                ...(courseImageFile && {
                    thumbnail: {
                        publicURL: imageUploadData.publicURL,
                        s3Key: imageUploadData.s3Key,
                    },
                }),
            },
        }).unwrap();

        toast.success("Lưu khóa học thành công!");
        setPromoVideo(null);
        setIsChanged(false);
        setExistedPromoVideo(videoUploadData.publicURL);
    };

    return (
        <div className="">
            {isUploading && (
                <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/50 z-9999">
                    <div className="flex flex-col items-center justify-center -translate-y-[50%]">
                        <div className="text-white mb-2">Đang tải video và ảnh lên...</div>
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
            <div className="fixed w-full min-h-[50px] py-2.5 top-0 left-0 bg-gray-800 z-50 text-white font-semibold">
                <div className="container flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/instructor/courses"
                            className="px-2 py-1 rounded hover:bg-gray-600"
                        >
                            Quay lại
                        </Link>
                        <p>{course.title}</p>
                    </div>
                    <div className="items-center flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={!isChanged}
                            className={`px-[18px] font-semibold py-1 rounded cursor-pointer disabled:cursor-not-allowed ${
                                isChanged ? "bg-white text-gray-800" : "bg-gray-600 text-white"
                            }`}
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg p-5 border-b border-b-grayText/20">Thông tin khóa học</h3>
            </div>
            <form className="space-y-5 p-5">
                {/* Course title */}
                <div className="space-y-2">
                    <label htmlFor="title" className="font-semibold">
                        Tiêu đề khóa học
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            maxLength={52}
                            placeholder="Nhập tiêu đề khóa học"
                            className={`border px-3 py-2 border-gray-300 rounded w-full focus:border-primary`}
                        />
                    </div>
                    {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                {/* Course subtitle */}
                <div className="">
                    <label htmlFor="subtitle" className="font-semibold">
                        Tiêu đề phụ khóa học
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="subtitle"
                            type="text"
                            value={formData.subtitle}
                            onChange={(e) => handleChange("subtitle", e.target.value)}
                            maxLength={120}
                            placeholder="Nhập tiêu đề phụ khóa học"
                            className="border px-3 py-2 border-gray-300 rounded w-full focus:border-primary"
                        />
                    </div>
                </div>
                <div>
                    <p className="font-semibold">Mô tả khóa học</p>
                    <div className="rounded-[6px] mt-1 focus-within:ring-blue-500 focus-within:ring-1 transition-colors">
                        
                        <SimpleEditor value={formData.description} onChange={handleQuillChange} placeholder={"Nhập mô tả khóa học"} mention={null} type="basic"></SimpleEditor>
                    </div>
                    {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                    )}
                </div>
                <div className="">
                    <h3 className="font-semibold">Thông tin cơ bản</h3>

                    <div className="grid grid-cols-3 gap-4 mt-1">
                        {/* Language Select */}
                        <div className="flex flex-col gap-1">
                            <label>Ngôn ngữ</label>
                            <Select
                                value={formData.language}
                                onValueChange={(value) => {
                                    handleChange("language", value);
                                   
                                }}
                            >
                                <SelectTrigger className="w-full px-3 py-2 min-h-[41px] text-[16px] rounded  border-gray-300">
                                    <SelectValue
                                        placeholder="Chọn ngôn ngữ"
                                        value={formData.language}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGE_OPTIONS.map((lang, index) => (
                                        <SelectItem key={index} value={lang.label}>
                                            {lang.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="">Cấp độ</label>
                            <Select
                                value={formData.level}
                                onValueChange={(value) => handleChange("level", value)}
                            >
                                <SelectTrigger className="w-full px-3 py-2  min-h-[41px] text-[16px] rounded leading-normal border-gray-300">
                                    <SelectValue placeholder="-- Chọn cấp độ --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LEVEL_OPTIONS.map((level, index) => (
                                        <SelectItem key={index} value={level.label}>
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Category Select */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <label className="">Danh mục</label>
                                <Select
                                    className="text-[16px]"
                                    value={formData.category}
                                    onValueChange={(value) => handleChange("category", value)}
                                >
                                    <SelectTrigger className="w-full px-3 py-2 min-h-[41px] text-[16px] rounded leading-normal border-gray-300">
                                        <SelectValue placeholder="--Chọn danh mục--" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courseCategories.map(
                                            (value) => (
                                                <SelectItem key={value} value={value}>
                                                    {value}
                                                </SelectItem>
                                            )
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="">
                    <h3 className="font-semibold mb-2">Ảnh khóa học</h3>
                    <div className="flex gap-6">
                        {/* Left box - Image preview */}
                        <div className="w-1/2 border h-[260px] border-gray-300 rounded flex items-center justify-center bg-gray-50">
                            {courseImage ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img
                                        src={courseImage}
                                        alt="Course preview"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="text-center">
                                    <svg
                                        className="w-32 h-32 mx-auto text-gray-400 mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="1"
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <p className="text-gray-500">Chưa có ảnh được tải lên</p>
                                </div>
                            )}
                        </div>

                        <div className="w-1/2">
                            <p className="text-gray-700 mb-4">
                                Tải lên hình ảnh khóa học của bạn ở đây. Nguyên tắc quan trọng:
                                750x422 pixel; .jpg, .jpeg, .gif hoặc .png. không có văn bản trên
                                hình ảnh
                            </p>

                            <label className="flex gap-3 cursor-pointer">
                                <div className="flex-1 px-4 py-2 border border-gray-300 rounded bg-gray-50">
                                    {courseImage ? "Đã chọn file" : "Chưa có file được chọn"}
                                </div>
                                <div className="px-6 flex items-center justify-center bg-primary text-white rounded hover:bg-primary/80 cursor-pointer whitespace-nowrap">
                                    {!courseImage ? "Tải file lên" : "Đổi"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        hidden
                                        ref={imageInputRef}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className="font-semibold mb-2">Video quảng cáo</h2>

                    <div className="flex gap-6">
                        <div className="w-1/2 border h-[260px] border-gray-300 rounded flex items-center justify-center bg-gray-50">
                            {promoVideo ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <p className="w-[80%]">
                                        Lưu các thay đổi để hoàn tất việc tải lên tệp của bạn.
                                    </p>
                                </div>
                            ) : existedPromoVideo ? (
                                <video
                                    src={existedPromoVideo}
                                    controls
                                    className="w-full h-full rounded"
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="flex justify-center gap-4 mb-4">
                                        <svg
                                            className="w-24 h-24 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1"
                                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <svg
                                            className="w-24 h-24 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="1"
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500">Chưa có video được tải lên</p>
                                </div>
                            )}
                        </div>

                        {/* Right box - Upload instructions */}
                        <div className="w-1/2">
                            <p className="text-gray-700 mb-4">
                                Video quảng cáo của bạn là cách nhanh chóng và hấp dẫn để học viên
                                xem trước những gì họ sẽ học trong khóa học của bạn.
                            </p>

                            <label className="flex gap-3 cursor-pointer">
                                <div className="flex-1 px-4 py-2 border border-gray-300 rounded bg-gray-50">
                                    {existedPromoVideo ? "Đã chọn file" : "Chưa có file được chọn"}
                                </div>
                                <div className="px-6 flex items-center justify-center bg-primary text-white rounded hover:bg-primary/80 cursor-pointer whitespace-nowrap">
                                    {!existedPromoVideo ? "Tải file lên" : "Đổi"}
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoChange}
                                        hidden
                                        ref={videoInputRef}
                                    />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Giá khóa học</h3>
                    <div className="flex gap-4 mt-1">
                        <div>
                            <div>Tiền tệ</div>
                            <div className="px-3 py-2 rounded border border-gray-300 mt-1">VND</div>
                        </div>
                        <div>
                            <label htmlFor="price">Giá</label>
                            <input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => handleChange("price", e.target.value)}
                                maxLength={52}
                                placeholder="Nhập giá khóa học"
                                className="border mt-1 px-3 py-2 border-gray-300 rounded w-full focus:border-primary"
                            />
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};
export default CourseInfo;
