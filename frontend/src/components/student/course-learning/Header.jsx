import React from 'react';
import { ChevronLeft, NotepadText, CircleQuestionMark, CheckCircle2 } from 'lucide-react';
import { useGetCourseProgressQuery } from '@/redux/api/progressApiSlice';
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useDispatch } from 'react-redux';
import { openNotesPanel } from '@/redux/features/notesSlice';
import NotesPanel from './NotesPanel';
import LiveSessionsSheet from './LiveSessionsSheet';
import SEO from '@/components/SEO';

const Header = ({ courseTitle, courseId, lectureId, sectionId }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleGoBack = () => {
        navigate(`/student/my-courses`);
    };

    const handleOpenNotes = () => {
        dispatch(openNotesPanel());
    };

    const { data: progress, isLoading: isProgressLoading } = useGetCourseProgressQuery(courseId);
    return (
        <>
            <SEO
                title={courseTitle}
            />

            <div className="sticky top-0 z-50 flex items-stretch bg-[#2f3f57] w-full shadow-lg text-white">
                <button
                    className="px-5 hover:bg-[#2a364c] transition-colors duration-300 hover:cursor-pointer"
                    onClick={handleGoBack}
                >
                    <ChevronLeft size={24} />
                </button>

                <div className="flex items-center pl-2">
                    <div className="flex items-end gap-3 py-3">
                        <img src="/logo_with_text.png" alt="Logo" className="h-8 w-auto" />
                        <span className="font-semibold text-[15px]">{courseTitle}</span>
                    </div>
                </div>

                <div className="flex items-center gap-6 ml-auto">
                    {isProgressLoading ? <ProgressSkeleton /> : <Progress progress={progress} />}

                    <div className="h-8 w-px bg-slate-500/50"></div>

                    <div className="flex items-center gap-6 pr-5">
                        <button
                            onClick={handleOpenNotes}
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            <NotepadText size={18} />
                            <span className="text-sm font-medium">Ghi chú</span>
                        </button>
                        <LiveSessionsSheet courseId={courseId}></LiveSessionsSheet>
                    </div>
                </div>
                <NotesPanel lectureId={lectureId} courseId={courseId} sectionId={sectionId} />
            </div>
        </>
    );
};

const Progress = ({ progress }) => {
    const progressData = progress || { percentage: 0, completedItems: 0, totalItems: 0, isCompleted: false };
    const radius = 20;
    const stroke = 2.5;
    const normalizedRadius = radius - stroke;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progressData.percentage / 100) * circumference;

    if (progressData.isCompleted) {
        return (
            <div className="flex items-center">
                <div className="flex items-center justify-center w-[44px] h-[44px] shadow-md">
                    <CheckCircle2 className="text-white bg-green-600 rounded-full" size={24} />
                </div>
                <div className="text-sm font-medium text-green-400">
                    <span className="font-bold">Hoàn thành</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
                <svg height={radius * 2} width={radius * 2} className="-rotate-90">
                    <circle
                        className="text-slate-600"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        className="text-[#4AC6FF]"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{ strokeDashoffset }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-medium text-white">
                        {`${progressData.percentage}%`}
                    </span>
                </div>
            </div>
            <div className="text-sm font-medium text-slate-200">
                <span className="font-bold">{progressData.completedItems}</span>
                <span>/{progressData.totalItems} bài học</span>
            </div>
        </div>
    );
};

const ProgressSkeleton = () => (
    <div className="flex items-center gap-3">
        <Skeleton className="h-[44px] w-[44px] rounded-full bg-slate-600/40" />
        <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-20 bg-slate-600/40" />
            <Skeleton className="h-3 w-16 bg-slate-600/40" />
        </div>
    </div>
);

export default Header;