import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


const CountItemsChart = ({ data }) => {
    return (
        <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height={384}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#BDE4F9" />
                    <XAxis
                        dataKey="month"
                        axisLine={{ stroke: "#007DD1" }}
                        label={{ position: 'insideBottomCenter', value: 'Thời gian', dy: 20 }}
                    />
                    <YAxis
                        axisLine={{ stroke: "#007DD1" }}
                        label={{ position: 'insideTopCenter', value: 'Số lượt xem', angle: -90, dx: -35 }}
                    />
                    <Tooltip
                        animationDuration={150}
                        cursor={false}
                        contentStyle={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #CFCFCF",
                            borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "#000000" }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: "20px" }}
                        iconType="circle"
                    />
                    <Bar
                        dataKey="lectureCount"
                        stackId="a"
                        fill="#0062A3"
                        name="Bài giảng"
                        radius={[0, 0, 0, 0]}
                    />
                    <Bar
                        dataKey="quizCount"
                        stackId="a"
                        fill="#2EABFF"
                        name="Bài tập"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default CountItemsChart