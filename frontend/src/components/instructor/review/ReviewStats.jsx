import { useGetSurvetStatsQuery } from "@/redux/api/reviewSlice";
import React from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import MetricCard from "@/components/instructor/course-engagement/MetricCard";

const chartConfig = {
    valuableInfo: { label: "Bạn có tìm hiểu được thông tin có giá trị không?", color: "#1a90ff" },
    clearExplanation: { label: "Nội dung giải thích các khái niệm có rõ ràng không?", color: "#1a90ff" },
    engagingDelivery: { label: "Cách giảng dạy của giảng viên có thu hút không?", color: "#1a90ff" },
    helpfulPractice: { label: "Bài tập hoặc thực hành có hữu ích không?", color: "#1a90ff" },
    accurateCourse: { label: "Khóa học này có đúng như mong đợi của bạn không?", color: "#1a90ff" },
    knowledgeableTeacher: { label: "Giảng viên có am hiểu về chủ đề không?", color: "#1a90ff" },
    percent: {
        label: "Tỷ lệ (%)"
    },
};

const ReviewStats = ({ courseId }) => {
    const { data: surveyStats, isLoading } = useGetSurvetStatsQuery(
        courseId === "all" ? skipToken : courseId
    );

    if (isLoading || courseId === "all")
        return (
            <p className="text-gray-500 font-medium">
                Chọn một khoá học để xem thống kê.
            </p>
        );

    const chartData = surveyStats.stats.map((item) => ({
        ...item,
        fill: chartConfig[item.key]?.color || "#8884d8",
    }));

    return (
        <div className="">
            <div className='mb-6'>
                <MetricCard
                    title="Số lượt đánh giá"
                    value={surveyStats?.totalReviews || 0}
                    description="tổng số đánh giá mà học viên đã gửi cho khóa học."
                    tooltip="Tổng số đánh giá"
                    unit="đánh giá"
                />
            </div>

            <ChartContainer config={chartConfig} className="h-80 w-full">
                <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    barSize={40}
                >
                    <YAxis
                        width={400}
                        tick={{ fontSize: 14, fontWeight: 500, fill: "#333" }}
                        dataKey="key"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => chartConfig[value]?.label}
                    />
                    <XAxis dataKey="percent" type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="percent" radius={4} />
                </BarChart>
            </ChartContainer>
        </div>
    );
};

export default ReviewStats;