import { FaRegFileAlt } from "react-icons/fa";
import { LuPencil, LuPlus } from "react-icons/lu";
import { FaRegTrashAlt } from "react-icons/fa";
import React, { useState, useEffect, useRef } from "react";
import { MdOutlineDragIndicator } from "react-icons/md";
import Lecture from "./Lecture";
import { IoClose } from "react-icons/io5";
import LectureModal from "./LectureModal";
import QuizModal from "./QuizModal";
import Quiz from "./Quiz";
import {
    useDeleteSectionMutation,
    useGetAllCurriculumItemsBySectionQuery,
    useUpdateSectionMutation,
} from "@/redux/api/sectionApiSlice";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    MouseSensor,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { toast } from "react-toastify";
import SortableItem from "./SortableItem";
import { Skeleton } from "@/components/ui/skeleton";

class CustomPointerSensor extends PointerSensor {
    static activators = [
        {
            eventName: "onPointerDown",
            handler: ({ nativeEvent: event }) => {
                // Bỏ qua nếu click vào input, textarea, button, select
                if (
                    event.target instanceof HTMLInputElement ||
                    event.target instanceof HTMLTextAreaElement ||
                    event.target instanceof HTMLSelectElement ||
                    event.target instanceof HTMLButtonElement ||
                    event.target.closest("input, textarea, select, button")
                ) {
                    return false;
                }

                return true;
            },
        },
    ];
}

const Section = ({ section, courseId, dragHandleProps, style }) => {
    const [sectionForm, setSectionForm] = useState({
        title: section.title || "",
        objective: section.objective || "",
    });

    const [isHovered, setIsHovered] = useState(false);
    const [mode, setMode] = useState("view");

    const [isOpenItemType, setIsOpenItemType] = useState(false);

    const [isLectureModalOpen, setIsLectureModalOpen] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

    const { data: curriculumItems, isLoading } = useGetAllCurriculumItemsBySectionQuery({
        courseId,
        sectionId: section._id,
    });

    const [updateSection] = useUpdateSectionMutation();

    const [items, setItems] = useState([]);

    useEffect(() => {
        if(!curriculumItems) return
        if (curriculumItems) {
            setItems(curriculumItems);
        }
    }, [curriculumItems]);

    const sensors = useSensors(
        useSensor(CustomPointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.findIndex((item) => item.itemContent._id.toString() === active.id);
        const newIndex = items.findIndex((item) => item.itemContent._id.toString() === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Cập nhật order từ 1
        const itemsWithNewOrder = newItems.map((item, index) => ({
            itemContent: item.itemContent,
            itemType: item.itemType,
            order: index + 1,
        }));

        setItems(itemsWithNewOrder);

        try {
            await updateSection({
                courseId,
                sectionId: section._id,
                data: {
                    curriculumItems: itemsWithNewOrder.map((item) => ({
                        order: item.order,
                        itemId: item.itemContent._id,
                        itemType: item.itemType,
                    })),
                },
            }).unwrap();
        } catch (error) {
            console.error("Failed to update order:", error);

            if (curriculumItems) {
                setItems(curriculumItems);
            }
        }
    };

    const handleUpdateTitleAndObjective = async () => {
        if (sectionForm.title === "") {
            toast.error("Phải nhập tên chương");
            setSectionForm({ ...sectionForm, title: section.title });
            return;
        }
        try {
            await updateSection({
                courseId,
                sectionId: section._id,
                data: {
                    title: sectionForm.title,
                    objective: sectionForm.objective,
                },
            }).unwrap();
        } catch (error) {
            toast.error("Lỗi khi cập nhật");
            console.error("Lỗi khi cập nhật: ", error);
        }

        setMode("view");
    };

    const [deleteSectionModalOpen, setDeleteSectionModalOpen] = useState(false);
    const [deleteSection, { isLoading: isDeleteingSection }] = useDeleteSectionMutation();

    const handleDeleteSection = async () => {
        setDeleteSectionModalOpen(false);
        try {
            await deleteSection({ courseId, sectionId: section._id }).unwrap();
        } catch (error) {
            toast.error("Lỗi khi xóa chương");
            console.error("Lỗi khi xóa chương: ", error);
        }
    };

    return (
        <div style={style} className="border rounded-md bg-primary/2 pb-4 border-gray-200 ">
            {mode === "view" && (
                <div
                    {...dragHandleProps}
                    className={`cursor-grab active:cursor-grabbing px-2 flex py-5 rounded-md items-center ${
                        isDeleteingSection ? "bg-red-500" : ""
                    }`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="flex gap-4 items-center">
                        <h3 className="font-semibold">Chương {section.order}:</h3>
                        <div className="flex items-center gap-2">
                            <FaRegFileAlt size={14}></FaRegFileAlt>
                            {sectionForm.title}
                        </div>
                    </div>
                    <div
                        className={`ml-2 flex items-center gap-1 transition-opacity duration-200 ${
                            isHovered ? "opacity-100" : "opacity-0"
                        }`}
                    >
                        <button
                            className="p-1 hover:bg-gray-200 rounded"
                            onClick={() => {
                                setMode("edit");
                                setIsHovered(false);
                            }}
                        >
                            <LuPencil size={16} className="text-gray-600" />
                        </button>
                        <button
                            onClick={() => setDeleteSectionModalOpen(true)}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <FaRegTrashAlt size={16} className="text-gray-600" />
                        </button>
                    </div>
                    <MdOutlineDragIndicator
                        size={18}
                        className={`${
                            isHovered ? "opacity-100" : "opacity-0"
                        } ml-auto text-gray-600`}
                    />
                </div>
            )}

            {mode === "edit" && (
                <div className="p-3 mt-2 px-2 bg-white border border-gray-300 rounded space-y-3">
                    <div className="flex gap-2 items-baseline">
                        <p className="font-semibold block mb-1">Chương {section.order}:</p>
                        <div className="flex-1 space-y-3">
                            <input
                                placeholder="Nhập tên chương"
                                autoFocus
                                onChange={(e) =>
                                    setSectionForm({ ...sectionForm, title: e.target.value })
                                }
                                value={sectionForm.title}
                                className="w-full border focus:border-primary border-gray-300 rounded px-2 py-[6px]"
                            />
                            <div>
                                <label className="font-semibold block mb-1 text-[14px]">
                                    Học viên có thể làm gì được sau chương này?
                                </label>
                                <input
                                    value={sectionForm.objective}
                                    onChange={(e) =>
                                        setSectionForm({
                                            ...sectionForm,
                                            objective: e.target.value,
                                        })
                                    }
                                    placeholder="Nhập mục tiêu học tập"
                                    className="w-full border border-gray-300 rounded px-2 py-[6px] focus:border-primary"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => {
                                setMode("view");
                            }}
                            className="text-black font-medium cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleUpdateTitleAndObjective}
                            className="cursor-pointer bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                        >
                            Lưu
                        </button>
                    </div>
                </div>
            )}
            <div className="mt-2 pl-12 pr-5 space-y-4">
                {!isLoading ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext
                            items={items.map((item) => item.itemContent._id.toString())}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <SortableItem
                                        key={item.itemContent._id.toString()}
                                        id={item.itemContent._id.toString()}
                                    >
                                        {item.itemType === "Lecture" ? (
                                            <Lecture
                                                key={index}
                                                item={item.itemContent}
                                                sectionOrder={section.order}
                                                lectureOrder={item.order}
                                                sectionId={section._id}
                                                courseId={courseId}
                                            ></Lecture>
                                        ) : (
                                            <Quiz
                                                key={index}
                                                item={item.itemContent}
                                                sectionOrder={section.order}
                                                quizOrder={item.order}
                                                sectionId={section._id}
                                                courseId={courseId}
                                            ></Quiz>
                                        )}
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : (
                    <div className="space-y-4">
                        <Skeleton className="h-[49.33px] rounded"></Skeleton>
                        <Skeleton className="h-[49.33px] rounded"></Skeleton>
                        <Skeleton className="h-[49.33px] rounded"></Skeleton>
                    </div>
                )}
                {isOpenItemType ? (
                    <div className="flex gap-3 mt-4 text-[14px]">
                        <button
                            onClick={() => setIsOpenItemType(false)}
                            className="text-gray-500 hover:text-black -ml-[30px] mb-4"
                        >
                            <IoClose size={18} />
                        </button>
                        <div className="border border-gray-300 border-dashed px-2 py-1 rounded flex gap-3">
                            <button
                                onClick={() => {
                                    setIsLectureModalOpen(true);
                                    setIsOpenItemType(false);
                                }}
                                className="text-primary hover:bg-primary/10 px-2 py-1 rounded flex items-center gap-1"
                            >
                                <LuPlus size={14} /> Bài giảng
                            </button>

                            <button
                                onClick={() => {
                                    setIsQuizModalOpen(true);
                                    setIsOpenItemType(false);
                                }}
                                className="text-primary hover:bg-primary/10 px-2 py-1 rounded flex items-center gap-1"
                            >
                                <LuPlus size={14} /> Quiz
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsOpenItemType(true)}
                        className={`px-3 py-1 mt-4 flex items-center gap-2 border rounded text-primary 
                    `}
                    >
                        <LuPlus size={16}></LuPlus>
                        Bài học
                    </button>
                )}
                <div>
                    <LectureModal
                        open={isLectureModalOpen}
                        onOpenChange={setIsLectureModalOpen}
                        sectionId={section._id}
                        courseId={courseId}
                    ></LectureModal>
                    <QuizModal
                        open={isQuizModalOpen}
                        onOpenChange={setIsQuizModalOpen}
                        sectionId={section._id}
                        courseId={courseId}
                    ></QuizModal>
                </div>
            </div>
            <Dialog open={deleteSectionModalOpen} onOpenChange={setDeleteSectionModalOpen}>
                <DialogContent className={"min-w-[500px] gap-1 p-0"}>
                    <DialogHeader className={"p-4 pb-0"}>
                        <DialogTitle className={"mb-0"}>Xác nhận</DialogTitle>
                    </DialogHeader>
                    <p className="px-4 mt-4">
                        Bạn sắp xóa một chương. Bạn có chắc chắn muốn tiếp tục không?
                    </p>
                    <DialogFooter className={"p-4"}>
                        <button
                            onClick={() => setDeleteSectionModalOpen(false)}
                            className="px-4 py-1 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleDeleteSection}
                            className="px-4 py-1 bg-primary text-white rounded hover:bg-primary/70 font-medium cursor-pointer"
                        >
                            OK
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Section;
