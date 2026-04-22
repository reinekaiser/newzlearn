import { Outlet, useLocation, Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaRegCheckCircle } from "react-icons/fa";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useProcessCourseMutation } from "@/redux/api/courseApiSlice";
const CourseManageLayout = () => {
    const location = useLocation();
    const navigate = useNavigate()
    const { courseAlias } = useParams();
    const MENU_ITEMS = [
        {
            title: "Đối tượng học viên",
            to: "goal",
        },
        {
            title: "Chương trình giảng dạy",
            to: "curriculum",
        },
        {
            title: "Thông tin khóa học",
            to: "basics",
        },
        {
            title: "Phụ đề",
            to: "captions",
        },
    ];

    const [processCourse, { isLoading }] = useProcessCourseMutation();
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [successData, setSuccessData] = useState(null);
    const handlePublish = async () => {
        try {
            const result = await processCourse(courseAlias).unwrap();

            console.log(result);
            if (!result.success) {
                setShowErrorModal(true);
                setValidationErrors(result.errors);
            } else {
                setSuccessData(result);
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            <div className="flex container mt-[60px] pb-[60px] gap-[30px] px-4">
                <div className="w-[20%] py-5">
                    <p className="font-medium pl-5">Nội dung khóa học</p>
                    <nav className="mt-4 flex flex-col gap-1">
                        {MENU_ITEMS.map((item, index) => {
                            const isActive =
                                location.pathname.split("/").filter(Boolean).pop() === item.to;
                            return (
                                <Link
                                    key={index}
                                    to={item.to}
                                    className={`flex relative gap-3 items-center h-12 px-4 hover:bg-primary/5 ${
                                        isActive ? "bg-primary/5" : ""
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 flex items-center justify-center">
                                            <FaRegCheckCircle />
                                        </div>
                                        <span className="font-light">{item.title}</span>
                                    </div>
                                    {isActive && (
                                        <div className="h-full w-[3px] bg-primary absolute left-0"></div>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                    <button
                        onClick={handlePublish}
                        disabled={isLoading}
                        className="mt-2 w-full py-2 font-semibold cursor-pointer text-center rounded bg-primary text-white"
                    >
                        Phát hành khóa học
                    </button>
                </div>
                <div className="flex-1 shadow-common min-h-[500px] rounded-md">
                    <Outlet />
                </div>
            </div>
            {isLoading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-lg font-medium">Đang kiểm tra khóa học...</p>
                        <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát</p>
                    </div>
                </div>
            )}
            {/* Modal hiển thị lỗi validation */}
            <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                            Khóa học chưa đủ điều kiện để phát hành
                        </DialogTitle>
                        <DialogDescription>
                            Vui lòng hoàn thiện các thông tin sau để có thể phát hành khóa học:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 mt-4">
                        {validationErrors.map((error, index) => (
                            <Alert key={index} variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ))}
                    </div>

                    <div className="flex justify-end mt-6">
                        <button
                            className="px-2 py-1 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => setShowErrorModal(false)}
                        >
                            Đã hiểu
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            {successData?.state === "processing"
                                ? "Khóa học đang được xử lý"
                                : "Phát hành thành công"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-4">
                        <p className="text-muted-foreground">{successData?.message}</p>
                        {successData?.state === "processing" && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Bạn sẽ nhận được thông báo khi các video đã được xử lý xong.
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <button
                            className="px-4 py-2 hover:bg-gray-100 rounded cursor-pointer"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            Đóng
                        </button>
                        <button
                            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 cursor-pointer"
                            onClick={() => navigate("/instructor/courses")}
                        >
                            Về trang danh sách khóa học
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CourseManageLayout;
