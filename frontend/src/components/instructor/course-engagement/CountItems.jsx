import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricCard from '@/components/instructor/course-engagement/MetricCard';
import { Skeleton } from "@/components/ui/skeleton";
import { useGetLearningItemsCountStatsQuery } from '@/redux/api/performentApiSlice';
import { getTotalLearningItems } from '@/utils';
import CountItemsChart from '@/components/instructor/course-engagement/CountItemsChart';

const CountItems = ({ selectedCourse }) => {
    const [filter, setFilter] = useState("12months")
    const { data, isLoading } = useGetLearningItemsCountStatsQuery({
        range: filter,
        courseId: selectedCourse
    })

    const { totalLectures, totalQuizzes } = useMemo(() => getTotalLearningItems(data?.result), [data?.result]);
    console.log(data)
    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <p className='font-semibold text-2xl'>Số lượt truy cập bởi học viên</p>
                        <Select value={filter} onValueChange={setFilter} defaultValue="12months">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="alltime">Mọi thời điểm</SelectItem>
                                <SelectItem value="1week">1 tuần qua</SelectItem>
                                <SelectItem value="6months">6 tháng qua</SelectItem>
                                <SelectItem value="12months">12 tháng qua</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="space-y-4">
                                    <Skeleton className="h-6 w-40 rounded-md" /> {/* title */}
                                    <Skeleton className="h-10 w-24 rounded-md" /> {/* value */}
                                    <Skeleton className="h-4 w-64 rounded-md" /> {/* description */}
                                </div>
                            ))}
                            <div className="col-span-2 h-[300px] w-full rounded-md">
                                <Skeleton className="h-full w-full rounded-md" />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-8 mb-6">
                                <MetricCard
                                    title="Số lượt xem bài học"
                                    value={totalLectures + totalQuizzes}
                                    description="tổng số lượt xem bài học của học viên trong khoảng thời gian được chọn."
                                    tooltip="Tổng số lượt xem bài học (bao gồm quiz) đã được xem "
                                    unit="bài"
                                />
                                <MetricCard
                                    title="Số học viên"
                                    value={data?.totalStudents}
                                    description="đã bắt đầu một bài học trong khoảng thời gian được chọn."
                                    tooltip="Số học viên đã xem"
                                    unit="học viên"
                                />
                            </div>
                            <CountItemsChart data={data?.result} />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default CountItems