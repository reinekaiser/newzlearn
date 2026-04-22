import React, { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MdOutlineDragIndicator } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
import { useUpdateCourseMutation } from "@/redux/api/courseApiSlice";
import { toast } from "react-toastify";

const SortableItem = ({ id, value, placeholder, onChange, onDelete, canDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        background: isDragging ? "#f9f9f9" : "white",
        display: "flex",
        borderRadius: "6px",
        marginBottom: "6px",
        width: "100%",
    };

    const [hover, setHover] = useState(false);
    const hasValue = value.trim().length > 0;

    return (
        <div
            ref={setNodeRef}
            style={style}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <div className=" w-[80%] border focus-within:bg-white transition-colors border-gray-300 py-2 px-3 rounded-md focus-within:border-primary">
                <input
                    value={value}
                    onChange={(e) => onChange(id, e.target.value)}
                    onFocus={() => setHover(true)}
                    onBlur={() => setHover(false)}
                    className="w-full placeholder:text-grayText/70"
                    placeholder={placeholder}
                />
            </div>
            {/* Drag handle */}
            {hover && hasValue && (
                <button
                    {...attributes}
                    {...listeners}
                    className="px-[10px] hover:bg-primary/5 text-lg border border-primary cursor-grab text-primary rounded-md"
                >
                    <MdOutlineDragIndicator />
                </button>
            )}
            {/* Delete button */}
            {hover && hasValue && (
                <button
                    onClick={() => canDelete && onDelete(id)}
                    disabled={!canDelete}
                    className={`${
                        canDelete ? "cursor-pointer" : "cursor-not-allowed"
                    } px-3 border border-primary rounded-md text-primary text-lg hover:bg-primary/5`}
                >
                    <FaRegTrashCan />
                </button>
            )}
        </div>
    );
};

const EditableList = ({ minItems = 1, placeholders, items, setItems, setIsChanged, isChanged }) => {
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            setItems(arrayMove(items, oldIndex, newIndex));
            setIsChanged(true);
        }
    };
    const handleChange = (id, value) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)));
        if (!isChanged) {
            setIsChanged(true);
        }
    };

    const handleDelete = (id) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
        if (!isChanged) {
            setIsChanged(true);
        }
    };

    const filledCount = items.filter((i) => i.value.trim() !== "").length;

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                {items.map((item, index) => (
                    <SortableItem
                        key={item.id}
                        id={item.id}
                        value={item.value}
                        placeholder={placeholders[index % minItems]}
                        onChange={handleChange}
                        onDelete={handleDelete}
                        canDelete={filledCount > minItems}
                    />
                ))}
            </SortableContext>
            <button
                disabled={filledCount < minItems}
                onClick={() => setItems((prev) => [...prev, { id: String(Date.now()), value: "" }])}
                className="text-primary font-medium mt-1 hover:cursor-pointer px-4 py-2 hover:bg-primary/20 rounded-md"
            >
                + Thêm câu trả lời
            </button>
        </DndContext>
    );
};

const CourseGoal = ({ course }) => {
    const [learningOutcomes, setLearningOutcomes] = useState(
        course.learningOutcomes?.length > 0
            ? course.learningOutcomes.map((outcome, index) => ({ id: index, value: outcome }))
            : [
                  { id: "1", value: "" },
                  { id: "2", value: "" },
                  { id: "3", value: "" },
                  { id: "4", value: "" },
              ]
    );

    const learningOutcomesPlaceholders = [
        "Ví dụ: Xác định yêu cầu bài toán",
        "Ví dụ: Nắm được quy trình trong một dự án",
        "Ví dụ: Tìm hiểu case study thực tế",
        "Ví dụ: Mô phỏng lại dư án",
    ];

    const [requirements, setRequirements] = useState(
        course.requirements?.length > 0
            ? course.requirements.map((requirement, index) => ({ id: index, value: requirement }))
            : [{ id: "1", value: "" }]
    );

    const requirementsPlaceholders = [
        "Ví dụ: Không cần kinh nghiệm, bạn sẽ được học mọi thứ cần thiết",
    ];

    const [intendedLearners, setIntendedLearners] = useState(
        course.intendedLearners?.length > 0
            ? course.intendedLearners.map((intendedLearner, index) => ({
                  id: index,
                  value: intendedLearner,
              }))
            : [{ id: "1", value: "" }]
    );

    const intendedLearnersPlaceholders = [
        "Ví dụ: Những người có nhu cầu tìm hiểu về khoa học dữ liệu",
    ];

    const [isChanged, setIsChanged] = useState(false);

    const [updateCourse] = useUpdateCourseMutation();

    const handleSave = async () => {
        if (learningOutcomes.filter((i) => i.value.trim() !== "").length < 4) {
            toast.error("Vui lòng nhập ít nhất 4 mục tiêu học tập");
            return;
        }

        await updateCourse({
            courseAlias: course.alias,
            data: {
                learningOutcomes: learningOutcomes.map((outcome) => outcome.value),
                ...(requirements.filter((i) => i.value.trim() !== "").length > 0 && {
                    requirements: requirements.map((requirement) => requirement.value),
                }),
                ...(intendedLearners.filter((i) => i.value.trim() !== "").length > 0 && {
                    intendedLearners: intendedLearners.map(
                        (intendedLearner) => intendedLearner.value
                    ),
                }),
            },
        });

        toast.success("Cập nhập thông tin khóa học thành công");
    };

    return (
        <div className="">
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
                    <div className="items-center flex gap-3">
                        <button
                            disabled={!isChanged}
                            onClick={handleSave}
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
                <h3 className="text-lg p-5 border-b border-b-grayText/20">Đối tượng học viên</h3>
                <div className="p-5 flex flex-col gap-5">
                    <div>
                        <p className="font-medium">Học viên sẽ học được gì trong khóa học?</p>
                        <p className="mt-4 w-[80%]">Nhập ít nhất 4 mục tiêu học tập.</p>
                        <div className="mt-2 flex flex-col gap-2 items-start">
                            <EditableList
                                minItems={4}
                                placeholders={learningOutcomesPlaceholders}
                                items={learningOutcomes}
                                setItems={setLearningOutcomes}
                                setIsChanged={setIsChanged}
                                isChanged={isChanged}
                            ></EditableList>
                        </div>
                    </div>
                    <div>
                        <p className="font-medium">
                            Các yêu cầu hoặc điều kiện tiên quyết để tham gia khóa học này là gì?
                        </p>

                        <div className="mt-2 flex flex-col gap-2 items-start">
                            <EditableList
                                placeholders={requirementsPlaceholders}
                                items={requirements}
                                setItems={setRequirements}
                                setIsChanged={setIsChanged}
                                isChanged={isChanged}
                            ></EditableList>
                        </div>
                    </div>
                    <div>
                        <p className="font-medium">Khóa học này giành cho ai?</p>

                        <div className="mt-2 flex flex-col gap-2 items-start">
                            <EditableList
                                placeholders={intendedLearnersPlaceholders}
                                items={intendedLearners}
                                setItems={setIntendedLearners}
                                setIsChanged={setIsChanged}
                                isChanged={isChanged}
                            ></EditableList>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseGoal;
