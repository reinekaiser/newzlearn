import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGetRevenueOverviewQuery } from "@/redux/api/performentApiSlice";
import MetricCard from "@/components/instructor/course-engagement/MetricCard";
import { Spinner } from "@/components/ui/spinner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import * as XLSX from "xlsx";
import { pdf } from "@react-pdf/renderer";
import InstructorReportPDF from "@/components/instructor/InstructorReportPDF";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return num.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const Overview = () => {
  const [range, setRange] = useState("alltime");
  const { data, isLoading } = useGetRevenueOverviewQuery({ range });

  const summary = data?.summary || {};
  const chartData = useMemo(() => data?.chart || [], [data?.chart]);

  const handleExportExcel = () => {
    if (!chartData || chartData.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(
      chartData.map((item) => ({
        "Thời gian": item.month,
        "Doanh thu (VNĐ)": item.revenue,
        "Lượt đăng ký": item.enrollments,
      })),
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tổng quan hiệu suất");
    XLSX.writeFile(workbook, "bao-cao-tong-quan.xlsx");
  };

  const handleExportPDF = async () => {
    if (!data) return;

    const blob = await pdf(
      <InstructorReportPDF data={data} range={range} />,
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bao-cao-tong-quan.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen mb-20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Tổng quan hiệu suất
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem nhanh doanh thu, lượt đăng ký và đánh giá giảng viên theo thời
              gian.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2">
                  <Download className="h-4 w-4" />
                  Xuất báo cáo
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <img src="/excel.svg" alt="excel" className="mr-2 h-4 w-4" />
                  Xuất Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <img src="/pdf.svg" alt="pdf" className="mr-2 h-4 w-4" />
                  Xuất PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alltime">Mọi thời điểm</SelectItem>
                <SelectItem value="6months">6 tháng qua</SelectItem>
                <SelectItem value="12months">12 tháng qua</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-8 md:grid-cols-3">
              <MetricCard
                title="Tổng doanh thu"
                value={formatCurrency(summary.totalRevenue || 0)}
                description={
                  range === "alltime"
                    ? "Doanh thu tích lũy từ tất cả lượt đăng ký."
                    : "Doanh thu trong khoảng thời gian đã chọn."
                }
                tooltip="Tổng số tiền bạn đã kiếm được trong khoảng thời gian chọn ở bộ lọc."
                unit=""
              />
              <MetricCard
                title="Tổng lượt đăng ký"
                value={summary.totalEnrollments || 0}
                description={
                  range === "alltime"
                    ? "Lượt đăng ký khóa học trong toàn bộ thời gian."
                    : "Lượt đăng ký khóa học trong khoảng thời gian đã chọn."
                }
                tooltip="Tổng số lần học viên mua/đăng ký khóa học trong khoảng thời gian được chọn."
                unit=""
              />
              <MetricCard
                title="Đánh giá giảng viên"
                value={
                  summary.instructorRating?.toFixed
                    ? summary.instructorRating.toFixed(2)
                    : summary.instructorRating || 0
                }
                description={
                  range === "alltime"
                    ? `${summary.ratingCount || 0} lượt đánh giá mọi thời điểm.`
                    : `${summary.ratingCount || 0} lượt đánh giá trong khoảng thời gian đã chọn.`
                }
                tooltip="Điểm đánh giá trung bình từ các review của học viên trong khoảng thời gian được chọn."
                unit="/ 5"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="revenue" className="w-full">
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
              <TabsTrigger value="enrollments">Lượt đăng ký</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    Biểu đồ doanh thu theo thời gian
                  </p>
                  <span className="text-sm text-muted-foreground">
                    Phạm vi:{" "}
                    {range === "alltime"
                      ? "Mọi thời điểm"
                      : range === "6months"
                        ? "6 tháng gần nhất"
                        : "12 tháng gần nhất"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height={384}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#BDE4F9" />
                      <XAxis
                        dataKey="month"
                        axisLine={{ stroke: "#007DD1" }}
                        tickMargin={10}
                        label={{
                          position: "insideBottomCenter",
                          value: "Thời gian",
                          dy: 25,
                        }}
                      />
                      <YAxis
                        axisLine={{ stroke: "#007DD1" }}
                        tickMargin={10}
                        label={{
                          position: "insideTopCenter",
                          value: "Doanh thu (VNĐ)",
                          angle: -90,
                          dx: -90,
                        }}
                      />
                      <Tooltip
                        animationDuration={150}
                        cursor={false}
                        formatter={(value) => [
                          formatCurrency(value),
                          "Doanh thu",
                        ]}
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #CFCFCF",
                          borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "#000000" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2EABFF"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <p className="text-xl font-semibold">
                    Biểu đồ lượt đăng ký theo thời gian
                  </p>
                  <span className="text-sm text-muted-foreground">
                    Phạm vi:{" "}
                    {range === "alltime"
                      ? "Mọi thời điểm"
                      : range === "6months"
                        ? "6 tháng gần nhất"
                        : "12 tháng gần nhất"}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height={384}>
                    <LineChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#BDE4F9" />
                      <XAxis
                        dataKey="month"
                        axisLine={{ stroke: "#007DD1" }}
                        tickMargin={10}
                        label={{
                          position: "insideBottomCenter",
                          value: "Thời gian",
                          dy: 25,
                        }}
                      />
                      <YAxis
                        axisLine={{ stroke: "#007DD1" }}
                        tickMargin={10}
                        allowDecimals={false}
                        label={{
                          position: "insideTopCenter",
                          value: "Lượt đăng ký",
                          angle: -90,
                          dx: -45,
                        }}
                      />
                      <Tooltip
                        animationDuration={150}
                        cursor={false}
                        formatter={(value) => [value, "Lượt đăng ký"]}
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          border: "1px solid #CFCFCF",
                          borderRadius: "var(--radius)",
                        }}
                        labelStyle={{ color: "#000000" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="enrollments"
                        stroke="#2EABFF"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Overview;
