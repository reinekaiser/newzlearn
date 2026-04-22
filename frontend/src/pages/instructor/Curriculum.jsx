import { useState, useEffect } from "react";

import Section from "../../components/instructor/curriculum/Section";
import { IoClose } from "react-icons/io5";
import { LuPlus } from "react-icons/lu";
import { Link, useParams } from "react-router-dom";
import {
    useAddSectionToCourseMutation,
    useGetAllSectionsByCourseQuery,
} from "@/redux/api/sectionApiSlice";
import { toast } from "react-toastify";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useGetCourseInfoQuery, useUpdateCourseMutation } from "@/redux/api/courseApiSlice";
import SortableItem from "@/components/instructor/curriculum/SortableItem";
import { Spinner } from "@/components/ui/spinner";

const Curriculum = () => {
    const { courseAlias } = useParams();
    const { data: sectionsData, isLoading } = useGetAllSectionsByCourseQuery(courseAlias);
    const { data: course, isLoading: isLoandingCourseInfo } = useGetCourseInfoQuery(courseAlias);

    const [sectionForm, setSectionForm] = useState({
        title: "",
        objective: "",
    });

    const [isAddingSection, setIsAddingSection] = useState(false);
    const [addSection] = useAddSectionToCourseMutation();

    const handleAddSection = async () => {
        if (sectionForm.title === "") {
            toast.error("Phải nhập tên chương");
            return;
        }

        try {
            await addSection({ courseId: course?._id, sectionData: sectionForm });
            setIsAddingSection(false);
        } catch (error) {
            console.error("ỗi khi thêm chương:", error);
            toast.error("Lỗi khi thêm chương");
        }
    };

    const [sections, setSections] = useState([]);

    useEffect(() => {
        if (sectionsData) {
            setSections(sectionsData);
        }
    }, [sectionsData]);

    const [updateSectionOrder] = useUpdateCourseMutation();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || !active) {
            return;
        }

        const oldIndex = sections.findIndex((section) => section._id.toString() === active.id);
        const newIndex = sections.findIndex((section) => section._id.toString() === over.id);

        const newSections = arrayMove(sections, oldIndex, newIndex);
        const sectionsWithNewOrder = newSections.map((section, index) => ({
            ...section,
            order: index + 1,
        }));
        setSections(sectionsWithNewOrder);

        try {
            await updateSectionOrder({
                courseId: course?._id,
                data: {
                    sections: sectionsWithNewOrder.map((item) => ({
                        sectionId: item._id,
                        order: item.order,
                    })),
                },
            }).unwrap();
        } catch (error) {
            console.error("Failed to update order:", error);
            if (sectionsData) {
                setSections(sectionsData);
            }
        }
    };

    if (isLoading || isLoandingCourseInfo)
        return (
            <div className="h-full">
                <div className="fixed w-full min-h-[50px] py-[10px] top-0 left-0 bg-gray-800 z-50">
                    <div className="container flex items-center justify-between text-white font-semibold">
                        <div className="flex items-center gap-2">
                            <Link
                                to="/instructor/courses"
                                className="px-2 py-1 rounded hover:bg-gray-600"
                            >
                                Quay lại
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="h-full w-full flex items-center justify-center">
                    <Spinner className="size-12" color="#098ce9" />
                </div>
            </div>
        );

    return (
        <div>
            <div className="fixed w-full min-h-[50px] py-[10px] top-0 left-0 bg-gray-800 z-50">
                <div className="container flex items-center justify-between text-white font-semibold">
                    <div className="flex items-center gap-2">
                        <Link
                            to="/instructor/courses"
                            className="px-2 py-1 rounded hover:bg-gray-600"
                        >
                            Quay lại
                        </Link>
                        <p>{course.title}</p>
                    </div>
                </div>
            </div>
            <div>
                <h3 className="text-lg p-5 border-b border-b-grayText/20">Chương trình học</h3>
                <div className="p-5">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={sections.map((section) => section._id.toString())}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-4">
                                {sections.map((section, index) => (
                                    <SortableItem
                                        key={section._id.toString()}
                                        id={section._id.toString()}
                                    >
                                        <Section
                                            index={index}
                                            section={section}
                                            courseId={course?._id}
                                        ></Section>
                                    </SortableItem>
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <div className="mt-3">
                        {isAddingSection ? (
                            <div className="">
                                <button
                                    onClick={() => {
                                        setIsAddingSection(false);
                                    }}
                                    className="p-1 rounded hover:bg-gray-200 flex items-center justify-center"
                                >
                                    <IoClose size={18} />
                                </button>

                                <div className="p-3 mt-2 bg-white border border-gray-300 rounded space-y-3">
                                    <div className="flex gap-2 items-baseline">
                                        <p className="font-semibold block mb-1">Chương mới:</p>
                                        <div className="flex-1 space-y-3">
                                            <input
                                                placeholder="Nhập tên chương"
                                                autoFocus
                                                onChange={(e) =>
                                                    setSectionForm({
                                                        ...sectionForm,
                                                        title: e.target.value,
                                                    })
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
                                                setIsAddingSection(false);
                                            }}
                                            className="text-black font-medium"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleAddSection}
                                            className="bg-primary text-white px-4 py-1 rounded hover:bg-primary/70"
                                        >
                                            Lưu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingSection(true)}
                                className="px-3 py-1 mt-4 flex items-center gap-2 border rounded text-primary "
                            >
                                <LuPlus size={16} /> Chương
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Curriculum;
