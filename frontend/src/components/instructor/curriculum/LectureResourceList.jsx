import {
    useDeleteFileFromS3Mutation,
    useDeleteResourceFromLectureMutation,
} from "@/redux/api/sectionApiSlice";
import { Download, ExternalLink, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "react-toastify";
import { useState } from "react";
const LectureResourceList = ({ resources, sectionId, lectureId }) => {
    const filesResource = resources.filter((r) => r.type === "file") || [];
    const linksResource = resources.filter((r) => r.type === "url") || [];

    const [deleteFileFromS3] = useDeleteFileFromS3Mutation();
    const [deleteResource] = useDeleteResourceFromLectureMutation();

    const [selected, setSelected] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleConfirmDelete = async () => {
        try {
            if (selected.type === "file") {
                await deleteFileFromS3({ s3Key: selected.s3Key });
            }
            await deleteResource({
                sectionId,
                lectureId,
                resourceId: selected._id,
            }).unwrap();

            setIsDeleteModalOpen(false);
            setSelected(null);
        } catch (err) {
            toast.error("Lỗi khi xóa", {
                position: "top-right",
                autoClose: 2000,
            });
        }
    };

    return (
        <div className="space-y-1 divide-y border-t pt-2">
            {filesResource.length > 0 && (
                <div>
                    <h3 className="font-semibold text-sm mb-1">Tài liệu có thể tải xuống</h3>
                    <ul className="">
                        {filesResource.map((file, index) => (
                            <li key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                    <Download className="w-3 h-3" />
                                    <span className="text-sm">{file.fileName}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelected(file);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="hover:bg-gray-100 p-1 rounded cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {linksResource.length > 0 && (
                <div>
                    <h3 className="font-semibold text-sm mb-1">Tài nguyên bên ngoài</h3>
                    <ul className="">
                        {linksResource.map((link, index) => (
                            <li key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center gap-2">
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="text-sm">{link.urlTitle}</span>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelected(link);
                                        setIsDeleteModalOpen(true);
                                    }}
                                    className="hover:bg-gray-100 p-1 rounded cursor-pointer"
                                >
                                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className={"min-w-[500px] gap-1 p-0"}>
                    <DialogHeader className={"p-4 pb-0"}>
                        <DialogTitle className={"mb-0"}>Xác nhận</DialogTitle>
                    </DialogHeader>
                    <p className="px-4 mt-4">
                        Bạn sắp xóa một tài nguyên. Bạn có chắc chắn muốn tiếp tục không?
                    </p>
                    <DialogFooter className={"p-4"}>
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50 "
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-1 bg-primary text-white rounded hover:bg-primary/70 font-medium"
                        >
                            OK
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default LectureResourceList;
