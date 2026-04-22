import MetricCard from '@/components/instructor/course-engagement/MetricCard';
import { useGetCourseStatsQuery } from '@/redux/api/performentApiSlice'
import React, { useState } from 'react'
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDown, Info, PlayCircle, SquareCheckBig } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CourseStats = ({ selectedCourse }) => {
    const { data, isLoading } = useGetCourseStatsQuery(selectedCourse);
    console.log("CourseStats data:", data);
    if (isLoading)
        return (
            <div>
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-6 w-40 rounded-md" /> {/* title */}
                        <Skeleton className="h-10 w-24 rounded-md" /> {/* value */}
                        <Skeleton className="h-4 w-64 rounded-md" /> {/* description */}
                    </div>
                ))}
            </div>
        )

    return (
        <div className='px-3'>
            <p className='font-bold text-2xl mb-3'>Thống kê theo khoá học</p>
            {selectedCourse == "all" ? (
                <p className='text-gray-500 text-sm font-medium pb-8'>Chọn một khoá học để xem thống kê chi tiết</p>
            ) : (
                <div>
                    <p className='text-gray-500 text-sm font-medium mb-5'>
                        Thống kê cho khoá học  {" "}
                        <span className='text-blue-500 text-base'>{data?.title}</span>
                    </p>
                    <div className='flex gap-8 mb-6'>
                        <MetricCard
                            title="Số bài học"
                            value={data?.totalItems}
                            description="tổng số  bài học của khoá học đã chọn."
                            tooltip="Tổng số bài học"
                            unit="bài"
                        />
                        <MetricCard
                            title="Số học viên"
                            value={data?.totalStudents}
                            description="tổng số học viên đã đăng ký khoá học đã chọn."
                            tooltip="Tổng số học viên đã đăng ký khoá học này"
                            unit="học viên"
                        />
                    </div>
                    {data?.sections.length > 0 && data.sections.map((section, id) => (
                        <div
                            key={id}
                            className='mb-8'
                        >
                            <SectionStats section={section} id={id} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const SectionStats = ({ section, id }) => {
    const [isOpen, setIsOpen] = useState(true);

    // console.log(section);

    return (
        <div>
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-card">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <h3 className="text-lg font-semibold text-card-foreground">{id + 1}.{" "}{section?.sectionTitle}</h3>
                    <ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <thead>
                                <tr className="border-b bg-muted/30">
                                    <th className="text-left p-4 font-medium text-sm w-3/5">
                                        <div className="flex items-center gap-2">
                                            Tên bài học
                                        </div>
                                    </th>
                                    <th className="text-left p-4 font-medium text-sm w-1/5">
                                        <div className="flex items-center gap-2">
                                            Đã xem
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Số học viên đã xem bài học / tổng số học viên khoá học</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </th>
                                    <th className="text-left p-4 font-medium text-sm w-1/5">
                                        <div className="flex items-center gap-2">
                                            Tỉ lệ hoàn thành
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Tỷ lệ học viên hoàn thành bài học</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {section?.items.map((item) => (
                                    <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                                        {item?.type === "Lecture" ? (
                                            <>
                                                <td className="p-4">
                                                    <div className="flex items-start gap-2">
                                                        <PlayCircle className="h-5 w-5 text-muted-foreground" />
                                                        <span className="font-medium">{item.title}</span>
                                                        <span className="text-muted-foreground text-sm">({item.duration})</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-foreground">{item.watched} học viên</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-start gap-3">
                                                        <span className="text-sm font-medium">{item.completedPercent}%</span>
                                                        <Progress value={item.completedPercent} className="flex-1" />
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <SquareCheckBig className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{item.title}</span>
                                                        <span className="text-muted-foreground text-sm">({item.duration})</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-foreground">{item.watched} học viên</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium">{item.completedPercent}%</span>
                                                        <Progress value={item.completedPercent} className="flex-1" />
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}

export default CourseStats