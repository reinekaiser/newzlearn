import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MinutesTaughtChart = ({ data }) => {

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
                        label={{ position: 'insideTopCenter', value: 'Số phút', angle: -90, dx: -35 }} 
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
                    <Bar
                        dataKey="minutes"
                        fill="#2EABFF"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}

export default MinutesTaughtChart