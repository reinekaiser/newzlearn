"use client";

import { useState } from "react"; 
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Star } from "lucide-react";
import { CardCatalog } from "@/components/student/courses-catalog/CardCatalog";
import { useBreakpoint } from "@/hooks/tiptap/useBreakpoint";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { useGetCourseSearchResultsQuery } from "@/redux/api/coursePublicApiSlice";

const categories = [
  "Lập trình", "Kinh doanh", "Thiết kế", "Tiếp thị",
  "CNTT & Phần mềm", "Phát triển cá nhân", "Nhiếp ảnh", "Âm nhạc",
];

const levels = ["Mọi cấp độ", "Người mới bắt đầu", "Trung cấp", "Nâng cao"];

const priceRanges = [
  { label: "Miễn phí", value: "free" },
  { label: "Trả phí", value: "paid" },
  { label: "Dưới ₫300,000", value: "under-300k" },
  { label: "₫300,000 - ₫500,000", value: "300k-500k" },
];

const durationOptions = [
  { value: "0-3", label: "0–3 giờ" },
  { value: "3-6", label: "3–6 giờ" },
  { value: "6-17", label: "6–17 giờ" },
  { value: "17-more", label: "hơn 17 giờ" },
];

const languageOptions = [
  { value: "English", label: "English" },
  { value: "Tiếng Việt", label: "Tiếng Việt" },
  { value: "spanish", label: "Español" },
  { value: "french", label: "Français" },
  { value: "german", label: "Deutsch" },
  { value: "japanese", label: "日本語" },
];

export function CoursesCatalog() {
  const COURSES_PER_PAGE = 6;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const currentPage = parseInt(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sort") || "default";

  const selectedCategories = searchParams.getAll("category");
  const selectedLevels = searchParams.getAll("level");
  const selectedPrices = searchParams.getAll("price");
  const selectedDurations = searchParams.getAll("duration");
  const selectedLanguages = searchParams.getAll("language");

  const [showMoreDurations, setShowMoreDurations] = useState(false);
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);

  const { data: courses } = useGetCourseSearchResultsQuery({
    q: q,
    courseDuration: selectedDurations,
    level: selectedLevels,
    category: selectedCategories,
    language: selectedLanguages,
    selectedPrices: selectedPrices,
    sort: sortBy,
    page: currentPage,
    limit: COURSES_PER_PAGE
  });

  const totalPages = courses?.totalPage || 1;
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE;


  const updateArrayParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    const currentValues = newParams.getAll(key);
    newParams.delete(key);

    if (currentValues.includes(value)) {
      currentValues.filter((v) => v !== value).forEach((v) => newParams.append(key, v));
    } else {
      [...currentValues, value].forEach((v) => newParams.append(key, v));
    }
    newParams.set("page", "1");

    setSearchParams(newParams);
  };

  const updateSingleParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key === 'sort') newParams.set("page", "1");

    setSearchParams(newParams);
  };

  const toggleCategory = (category) => updateArrayParam("category", category);
  const toggleLevel = (level) => updateArrayParam("level", level);
  const togglePrice = (price) => updateArrayParam("price", price);
  const toggleDuration = (duration) => updateArrayParam("duration", duration);
  const toggleLanguage = (language) => updateArrayParam("language", language);

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn lên đầu trang
  };

  const handleSortChange = (value) => {
    updateSingleParam("sort", value);
  };

  const onClickCourse = (courseId, courseAlias) => {
    navigate(`/course/${courseAlias}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header q={q} />
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-3xl font-bold text-foreground">
            {q ? `Tìm kiếm khóa học theo từ khóa: "${q}"` : "Tất cả các khóa học"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {q ? `Kết quả tìm kiếm cho từ khóa "${q}"` : "Khám phá bộ sưu tập khóa học toàn diện của chúng tôi"}
          </p>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex gap-3 ">
          {/* Sidebar Filters */}
          <div className="w-56 shrink-0 ">
            <div className=" top-8 space-y-6">
              {/* Category */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Danh mục</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <Label htmlFor={category} className="text-sm font-normal">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Duration */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Thời gian video</h3>
                <div className="space-y-2">
                  {durationOptions
                    .slice(0, showMoreDurations ? durationOptions.length : 3)
                    .map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`duration-${option.value}`}
                          checked={selectedDurations.includes(option.value)}
                          onCheckedChange={() => toggleDuration(option.value)}
                        />
                        <Label htmlFor={`duration-${option.value}`} className="text-sm font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                </div>
                {durationOptions.length > 3 && (
                  <button
                    onClick={() => setShowMoreDurations(!showMoreDurations)}
                    className="mt-2 text-sm font-medium text-[#098be4] hover:text-[#066ab3]"
                  >
                    {showMoreDurations ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>

              {/* Language */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Ngôn ngữ</h3>
                <div className="space-y-2">
                  {languageOptions
                    .slice(0, showMoreLanguages ? languageOptions.length : 3)
                    .map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`language-${option.value}`}
                          checked={selectedLanguages.includes(option.value)}
                          onCheckedChange={() => toggleLanguage(option.value)}
                        />
                        <Label htmlFor={`language-${option.value}`} className="text-sm font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                </div>
                {languageOptions.length > 3 && (
                  <button
                    onClick={() => setShowMoreLanguages(!showMoreLanguages)}
                    className="mt-2 text-sm font-medium text-[#098be4] hover:text-[#066ab3]"
                  >
                    {showMoreLanguages ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </div>

              {/* Level */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Cấp độ</h3>
                <div className="space-y-2">
                  {levels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={() => toggleLevel(level)}
                      />
                      <Label htmlFor={level} className="text-sm font-normal">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <h3 className="mb-3 text-sm font-medium">Giá</h3>
                <div className="space-y-2">
                  {priceRanges.map((range) => (
                    <div key={range.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={range.value}
                        checked={selectedPrices.includes(range.value)}
                        onCheckedChange={() => togglePrice(range.value)}
                      />
                      <Label htmlFor={range.value} className="text-sm font-normal">
                        {range.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Course Grid */}
          <main className="px-10 flex-1">
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị {courses?.results?.length > 0 ? startIndex + 1 : 0}-
                {Math.min(startIndex + (courses?.results?.length || 0), courses?.totalCourse || 0)} trong tổng số {courses?.totalCourse || 0} kết quả
              </div>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sắp xếp theo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Đề cử</SelectItem>
                  <SelectItem value="new">Mới nhất</SelectItem>
                  <SelectItem value="priceUp">Giá: Thấp đến Cao</SelectItem>
                  <SelectItem value="priceDown">Giá: Cao đến Thấp</SelectItem>
                  <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 lg:grid-cols-3">
              {courses?.results.map((course, index) => (
                <div
                  key={course._id}
                  className="h-full"
                  onClick={() => onClickCourse(course._id, course.alias)}
                >
                  <CardCatalog
                    key={course._id}
                    course={course}
                    index={index}
                    columns={3}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {[...Array(totalPages)].map((_, i) => {
                      const pageNumber = i + 1;
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNumber)}
                              isActive={currentPage === pageNumber}
                              className="cursor-pointer"
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}