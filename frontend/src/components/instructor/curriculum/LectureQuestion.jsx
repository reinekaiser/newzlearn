import React, { useState, useRef, useEffect } from "react";
import LectureQuestionModal from "@/components/instructor/curriculum/LectureQuestionModal";
import { FaRegTrashAlt } from "react-icons/fa";
import { LuPencil } from "react-icons/lu";
import { useAddLectureQuestionMutation, useGetLectureQuestionsQuery, useUpdateLectureQuestionMutation, useDeleteLectureQuestionMutation } from "@/redux/api/lectureQuestionApiSlice";
import { toast } from "react-toastify";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LectureQuestion = ({ itemId, item, sectionId, courseId }) => {

    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

    return (
        <div className="border-t border-t-gray-200 mt-2">
            <div className='flex items-center my-2'>
                <p className="px-2 font-semibold">Câu hỏi trong bài giảng</p>
                <button
                    className='px-3 py-1 text-sm font-semibold border rounded text-primary cursor-pointer hover:bg-primary/10'
                    onClick={() => {
                        setIsQuestionModalOpen(true);
                    }}
                >
                    Xem và thêm câu hỏi
                </button>
            </div>
            <LectureQuestionModal
                item={item}
                open={isQuestionModalOpen}
                onOpenChange={setIsQuestionModalOpen}
                itemId={itemId}
            />
        </div>
    )
}



export default LectureQuestion