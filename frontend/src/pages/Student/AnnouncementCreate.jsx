import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function AnnouncementCreatePage() {
  const [filters, setFilters] = useState({
    enrollmentDate: true,
    courseProgress: true,
    excludeByCourse: true,
  });

  const [selectedProgress, setSelectedProgress] = useState([
    "0",
    "1-49",
    "50-99",
    "100",
  ]);

  const toggleFilter = (key) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const clearFilters = () =>
    setFilters({
      enrollmentDate: false,
      courseProgress: false,
      excludeByCourse: false,
    });

  const toggleProgress = (value) => {
    setSelectedProgress((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const countActiveFilters = Object.values(filters).filter(Boolean).length;

  return (
    <>
     <Header />
      {/* LAYOUT */}
      <div className="flex bg-white min-h-screen">

        {/* SIDEBAR */}
        <div className="w-64 min-h-screen bg-gray-50 p-6 border-r">
          <ul className="space-y-8 text-gray-700 text-[15px]">
            <li className="cursor-pointer hover:text-black">Q&A</li>

            <li className="cursor-pointer hover:text-black flex items-center gap-2">
              Tin nhắn
              <span className="bg-[#098be4] text-white text-xs px-2 py-0.5 rounded-full">
                5
              </span>
            </li>

            <li className="cursor-pointer hover:text-black font-semibold text-[#098be4]">
              Thông báo
            </li>
          </ul>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 p-10 ">

          {/* HEADER + BACK BUTTON */}
          <div className="flex items-center justify-between mb-10">
            <h1 className="text-3xl font-semibold">Tạo thông báo mới</h1>

            <Link
              to="/announcements"
              className="px-4 py-2 border rounded-md hover:bg-gray-100 transition flex items-center gap-2"
            >
              <ChevronLeft size={20} /> Quay lại
            </Link>
          </div>

          {/* ---------------------- PAGE CONTENT --------------------------- */}

          <h2 className="text-lg font-semibold mb-2">Người nhận</h2>

          <p className="text-gray-600 text-sm mb-4">
            Xác định học viên bạn muốn gửi thông báo...
          </p>

          {/* Warning Box */}
          <div className="border border-red-300 bg-red-50 p-4 rounded-md flex gap-3 mb-6">
            <div className="text-red-600 text-xl">⚠</div>
            <div>
              <p className="font-medium text-red-700">
                Hiện bạn chưa có khóa học nào.
              </p>
              <p className="text-sm text-red-600">
                Hãy tạo ít nhất một khóa học trước khi gửi thông báo.
              </p>
            </div>
          </div>

          {/* COURSE SELECT */}
          <label className="text-sm font-medium">Khóa học</label>
          <input
            type="text"
            placeholder="Tìm kiếm khóa học"
            className="w-full border rounded-md px-3 py-2 mt-1"
          />

          <div className="h-10"></div>

          {/* FILTER GROUP */}
          <h2 className="text-lg font-semibold mb-2">Lọc người nhận theo</h2>

          {/* FILTER TAGS */}
          <div className="flex items-center gap-2 flex-wrap mb-6">

            <button
              onClick={() => toggleFilter("enrollmentDate")}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.enrollmentDate
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {filters.enrollmentDate ? "✓ " : "+ "}Ngày đăng ký
            </button>

            <button
              onClick={() => toggleFilter("courseProgress")}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.courseProgress
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {filters.courseProgress ? "✓ " : "+ "}Tiến độ khóa học
            </button>

            <button
              onClick={() => toggleFilter("excludeByCourse")}
              className={`px-3 py-1 rounded-full text-sm border ${
                filters.excludeByCourse
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {filters.excludeByCourse ? "✓ " : "+ "}Loại trừ theo khóa học
            </button>

            {countActiveFilters > 0 && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-700"
              >
                ✕ Xóa bộ lọc ({countActiveFilters})
              </button>
            )}
          </div>

          {/* Enrollment Date */}
          {filters.enrollmentDate && (
            <div className="mb-8">
              <h3 className="font-medium mb-2">Ngày đăng ký</h3>
              <p className="text-sm text-gray-600 mb-2">
                Lọc theo ngày đăng ký.
              </p>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm">Sau ngày</label>
                  <input type="date" className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>

                <div className="flex-1">
                  <label className="text-sm">Trước ngày</label>
                  <input type="date" className="w-full border rounded-md px-3 py-2 mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* Course Progress */}
          {filters.courseProgress && (
            <div className="mb-8">
              <h3 className="font-medium mb-2">Tiến độ khóa học</h3>

              <div className="flex flex-col gap-2 ml-2">
                {[
                  { label: "0% (Chưa bắt đầu)", value: "0" },
                  { label: "1–49%", value: "1-49" },
                  { label: "50–99%", value: "50-99" },
                  { label: "100% (Hoàn thành)", value: "100" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedProgress.includes(item.value)}
                      onChange={() => toggleProgress(item.value)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Exclude By Course */}
          {filters.excludeByCourse && (
            <div className="mb-8">
              <h3 className="font-medium mb-1">Loại trừ theo khóa học</h3>
              <input
                type="text"
                placeholder="Tìm kiếm khóa học"
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          )}

          {/* CONTENT BLOCK */}
          <h2 className="text-lg font-semibold mb-4">Nội dung</h2>

          <div className="mb-4">
            <label className="text-sm font-medium">Tiêu đề</label>
            <input
              type="text"
              placeholder="Nhập tiêu đề (tối đa 65 ký tự)"
              className="w-full border rounded-md px-3 py-2 mt-1"
            />
          </div>

          <div className="mb-8">
            <label className="text-sm font-medium">Nội dung</label>
            <textarea
              className="w-full border rounded-md px-3 py-2 h-60"
              placeholder="Nhập nội dung thông báo…"
            ></textarea>
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link to="/announcements" className="px-4 py-2 rounded-md border">
              Hủy
            </Link>

            <button className="px-4 py-2 rounded-md bg-blue-600 text-white">
              Gửi
            </button>
          </div>

        </div>
      </div>
         <Footer />
    </>
  );
}
