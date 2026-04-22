import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import React, { useMemo, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useGetItemsProgressQuery } from '@/redux/api/progressApiSlice'
import { Spinner } from '@/components/ui/spinner'
import { MdOutlineOndemandVideo } from 'react-icons/md'
import { PiPuzzlePieceBold } from 'react-icons/pi'
import { IoDocumentTextOutline } from 'react-icons/io5'
import Resources from '@/components/student/course-learning/Resources'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

const formatDuration = (s) => {
    if (!s || isNaN(s)) return "00:00";
    s = Math.round(s);
    const m = Math.floor(s / 60);
    const sec = s % 60;

    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
};

const SectionsAccordion = ({ courseId, sections, handleChangeItem, currentItem, isDone }) => {
    const { data: itemsProgress, isLoading: isProgressLoading, refetch } =
        useGetItemsProgressQuery(courseId);
    const [openSections, setOpenSections] = useState([])

    useEffect(() => {
        if (isDone) {
            const timeout = setTimeout(() => refetch(), 500);
            return () => clearTimeout(timeout);
        }
    }, [isDone, refetch]);

    useEffect(() => {
        if (!currentItem || !sections) return
        const sectionIndex = sections.findIndex(sec =>
            sec.curriculumItems?.some(item => item._id === currentItem.itemId)
        )
        if (sectionIndex !== -1) {
            const sectionKey = `section-${sectionIndex}`
            setOpenSections(prev => (prev.includes(sectionKey) ? prev : [...prev, sectionKey]))
        }
    }, [currentItem, sections])

    const sectionsWithComputedData = useMemo(() => {
        const completedItemIds = new Set(
            itemsProgress?.filter(p => p.isCompleted).map(p => p.itemId) || []
        )
        return sections.map(section => {
            const totalItems = section.curriculumItems?.length || 0
            const totalDuration = section.curriculumItems?.reduce((sum, item) => {
                const duration = item?.content?.duration || 0
                return sum + duration
            }, 0) || 0
            const completedItems = section.curriculumItems?.filter(item =>
                completedItemIds.has(item._id)
            ).length || 0
            return {
                ...section,
                totalItems,
                totalDuration,
                completedItems,
            }
        })
    }, [sections, itemsProgress])

    if (isProgressLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="size-12" color="#098ce9" />
            </div>
        )
    }

    const handleChange = (itemId, itemType) => {
        handleChangeItem(itemId, itemType)
    }

    return (
        <div className="border-t border-gray-200 lg:border-t-0 lg:border-l">
            <div className="px-5 py-4 text-[15px] font-semibold border-b border-gray-200">
                Nội dung bài học
            </div>
            <Accordion
                type="multiple"
                value={openSections}
                onValueChange={setOpenSections}
                className="w-full"
            >
                {sectionsWithComputedData.map((section, idx) => (
                    <AccordionItem key={section._id} value={`section-${idx}`}>
                        <AccordionTrigger className="group cursor-pointer px-5 py-4 bg-gray-50 hover:bg-gray-100 [&>svg]:hidden">
                            <div className="flex-1">
                                <div className="font-semibold text-left text-[16px]">
                                    {idx + 1}. {section.title}
                                </div>
                                <div className="text-[13px] text-gray-500 mt-2 text-left">
                                    {section.completedItems} / {section.totalItems} bài học |{' '}
                                    {formatDuration(section.totalDuration)}
                                </div>
                            </div>
                            <div>
                                <ChevronDown className="text-gray-600 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </div>
                        </AccordionTrigger>

                        <AccordionContent className="cursor-pointer">
                            {section.curriculumItems?.map((item, indx) => {
                                const isCompleted = (() => {
                                    const progressFromDb = itemsProgress?.find(p => p.itemId === item._id);
                                    if (progressFromDb !== undefined) return progressFromDb.isCompleted;
                                    if (currentItem?.itemId === item._id) return isDone;
                                    return false;
                                })();
                                const isActive =
                                    currentItem?.itemId === item._id &&
                                    currentItem?.itemType === item.itemType
                                return (
                                    <div
                                        key={item._id}
                                        className={`flex items-center border-b py-3 hover:bg-gray-100 duration-300 ${isActive ? 'bg-gray-200' : ''
                                            }`}
                                        onClick={() =>
                                            handleChange(item._id, item.itemType)
                                        }
                                    >
                                        <div className="flex justify-center items-center px-4">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-not-allowed opacity-70
                                                        ${isCompleted ? "bg-blue-500" : "bg-white border-gray-300"}`}
                                                    >
                                                        {isCompleted && (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-3 h-3 text-white"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent side="right" align="center">
                                                    <p>Hoàn thành bài <br /> học để đánh dấu</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                        <div className="flex-1 text-sm">
                                            <div className='flex items-center justify-between'>
                                                <div className="mb-2">
                                                    <span className="text-gray-600">
                                                        {indx + 1}. {item.title}
                                                    </span>
                                                    {item.itemType === 'Lecture' ? (
                                                        <span className="flex items-center justify-between gap-2 text-xs text-gray-400 mt-3">
                                                            <div className='flex items-center gap-2'>
                                                                {item.type === 'video' ? (
                                                                    <MdOutlineOndemandVideo className="w-4 h-4" />
                                                                ) : (
                                                                    <IoDocumentTextOutline className="w-4 h-4" />
                                                                )}
                                                                {formatDuration(item?.content?.duration)}
                                                            </div>

                                                            {item?.resources && item?.resources.length > 0 && (
                                                                <div
                                                                    className='shrink-0 pr-4 self-end'
                                                                    onMouseEnter={(e) => e.stopPropagation()}
                                                                    onMouseLeave={(e) => e.stopPropagation()}
                                                                >
                                                                    <Resources resources={item?.resources} />
                                                                </div>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-2 text-xs text-gray-400 mt-3">
                                                            <PiPuzzlePieceBold className="w-4 h-4" />
                                                            {item.questions.length} câu
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                )
                            })}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    )
}

export default SectionsAccordion