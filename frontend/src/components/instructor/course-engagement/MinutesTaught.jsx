import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricCard from '@/components/instructor/course-engagement/MetricCard';
import MinutesTaughtChart from '@/components/instructor/course-engagement/MinutesTaughtChart';
import { useGetLearningMinutesStatsQuery } from '@/redux/api/performentApiSlice';
import { getTotals } from '@/utils';
import { Skeleton } from "@/components/ui/skeleton";

const MinutesTaught = ({ selectedCourse }) => {
    const [filter, setFilter] = useState("12months")
    const { data, isLoading } = useGetLearningMinutesStatsQuery({
        range: filter,
        courseId: selectedCourse
    })
    const { totalMinutes } = useMemo(() => getTotals(data?.result), [data?.result]);

    // console.log(data)

    return (
        <div>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <p className='text-2xl font-semibold'>Số phút được xem bởi học viên</p>
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
                            <div className="mb-6">
                                <div className="">
                                    <div className='flex gap-8 mb-6'>
                                        <MetricCard
                                            title="Số phút đã dạy"
                                            value={totalMinutes}
                                            description="của các bài giảng mà học viên đã xem trong khoảng thời gian được chọn."
                                            tooltip="Tổng số phút nội dung đã được xem"
                                            unit="phút"
                                        />
                                        <MetricCard
                                            title="Số học viên"
                                            value={data?.totalStudents}
                                            description="đã bắt đầu một bài giảng trong khoảng thời gian được chọn."
                                            tooltip="Số học viên đã xem"
                                            unit="học viên"
                                        />
                                    </div>
                                </div>
                            </div>
                            <MinutesTaughtChart data={data?.result} />
                        </div>
                    )}

                </CardContent>
            </Card>
        </div >
    )
}

export default MinutesTaught