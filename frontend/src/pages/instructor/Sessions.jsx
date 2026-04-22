// pages/TeacherSessionsPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar, Plus } from "lucide-react";
import { useGetSessionsQuery } from "@/redux/api/sessionApiSlice";
import { useGetAllCoursesInfoQuery } from "@/redux/api/coursePublicApiSlice";
import { Spinner } from "@/components/ui/spinner";
import SessionModal from "@/components/instructor/sessions/SessionModal";
import SessionCard from "@/components/instructor/sessions/SessionCard";

const Sessions = () => {

    // State cho filters
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        status: "all",
        courseId: "all",
        fromDate: "",
        toDate: "",
        sortBy: "scheduledStart",
        sortOrder: "asc",
    });

    // RTK Query
    const {
        data,
        isLoading: isLoadingSessions,
        isError,
        error,
        refetch,
    } = useGetSessionsQuery({
        ...filters,
        courseId: filters.courseId === "all" ? "" : filters.courseId,
        status: filters.status === "all" ? "" : filters.status,
    });

    const { data: courses, isLoading: isLoadingCourses } = useGetAllCoursesInfoQuery();

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    // Reset filters
    const handleResetFilters = () => {
        setFilters({
            page: 1,
            limit: 10,
            status: "",
            courseId: "",
            fromDate: "",
            toDate: "",
            sortBy: "scheduledStart",
            sortOrder: "asc",
        });
    };

    const [openCreateSessionModal, setOpenCreateSessionModal] = useState(false);

    if (isError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-red-600">
                    <p>Lỗi khi tải danh sách buổi học: {error?.data?.message || "Có lỗi xảy ra"}</p>
                    <Button onClick={refetch} className="mt-4">
                        Thử lại
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoadingCourses) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="size-12" color="#098ce9" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-4 mb-16">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-foreground">Buổi học live</h1>
                    <Select
                        value={filters.courseId}
                        onValueChange={(value) => handleFilterChange("courseId", value)}
                        defaultValue="all"
                    >
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Chọn khóa học" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem className="data-[state=checked]:font-bold" value="all">
                                Tất cả khóa học
                            </SelectItem>
                            {courses?.map((course, id) => (
                                <SelectItem
                                    key={id}
                                    value={course?._id}
                                    className="truncate max-w-full data-[state=checked]:font-bold"
                                >
                                    {course?.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <SessionModal
                    open={openCreateSessionModal}
                    onOpenChange={setOpenCreateSessionModal}
                    courses={courses}
                    trigger={
                        <Button className="gap-2">
                            <Plus size={20} />
                            Tạo buổi học mới
                        </Button>
                    }
                ></SessionModal>
            </div>

            {/* Filters */}
            <div className="mt-6">
                <div>
                    <div className="flex gap-5">
                        <Select
                            value={filters.status}
                            onValueChange={(value) => handleFilterChange("status", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                                <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                                <SelectItem value="live">Đang diễn ra</SelectItem>
                                <SelectItem value="ended">Đã kết thúc</SelectItem>
                                <SelectItem value="cancelled">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Date range */}
                        <div className="flex gap-2 ">
                            <div className="flex gap-2 items-center">
                                <label htmlFor="" className="whitespace-nowrap">
                                    Từ ngày
                                </label>
                                <Input
                                    type="date"
                                    value={filters.fromDate}
                                    onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                                    placeholder="Từ ngày"
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <label className="whitespace-nowrap">Đến ngày</label>
                                <Input
                                    type="date"
                                    value={filters.toDate}
                                    onChange={(e) => handleFilterChange("toDate", e.target.value)}
                                    placeholder="Đến ngày"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <Select
                            value={filters.sortOrder}
                            onValueChange={(value) => handleFilterChange("sortOrder", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sắp xếp" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="asc">Cũ nhất trước</SelectItem>
                                <SelectItem value="desc">Mới nhất trước</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            className={"ml-auto"}
                            variant="outline"
                            onClick={handleResetFilters}
                        >
                            Xóa bộ lọc
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                {data?.sessions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg">
                        <Calendar size={64} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-4">Không tìm thấy buổi học nào</p>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        {data?.sessions.map((session) => (
                            <SessionCard session={session} courses={courses}></SessionCard>
                        ))}
                        {data?.pagination && data.pagination.totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                onClick={() =>
                                                    handlePageChange(Math.max(1, filters.page - 1))
                                                }
                                                className={
                                                    filters.page <= 1
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>

                                        {Array.from(
                                            { length: Math.min(5, data.pagination.totalPages) },
                                            (_, i) => {
                                                let pageNum;
                                                if (data.pagination.totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (filters.page <= 3) {
                                                    pageNum = i + 1;
                                                } else if (
                                                    filters.page >=
                                                    data.pagination.totalPages - 2
                                                ) {
                                                    pageNum = data.pagination.totalPages - 4 + i;
                                                } else {
                                                    pageNum = filters.page - 2 + i;
                                                }

                                                return (
                                                    <PaginationItem key={pageNum}>
                                                        <PaginationLink
                                                            onClick={() =>
                                                                handlePageChange(pageNum)
                                                            }
                                                            isActive={filters.page === pageNum}
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            },
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                onClick={() =>
                                                    handlePageChange(
                                                        Math.min(
                                                            data.pagination.totalPages,
                                                            filters.page + 1,
                                                        ),
                                                    )
                                                }
                                                className={
                                                    filters.page >= data.pagination.totalPages
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sessions;
