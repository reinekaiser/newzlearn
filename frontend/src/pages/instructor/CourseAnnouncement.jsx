import { useSendAnnouncementMutation } from "@/redux/api/announcementApiSlice";
import { useSearchCoursesQuery } from "@/redux/api/courseApiSlice";
import React, { useState } from "react";
import ReactQuillNew from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-toastify";

const CourseAnnouncement = () => {
  // ------------------ STATES --------------------
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

  const [selectAllCourses, setSelectAllCourses] = useState(false);
  const [sendAnnouncement, { isLoading }] = useSendAnnouncementMutation();

  const resetForm = () => {
  setFilters({
    enrollmentDate: true,
    courseProgress: true,
    excludeByCourse: true,
  });

  setSelectedProgress(["0", "1-49", "50-99", "100"]);

  setSelectAllCourses(false);
  setSelectedCourses([]);
  setQuery("");

  setExcludedCourses([]);
  setExcludeQuery("");

  setFormData({
    title: "",
    description: "",
    afterDate: "",
    beforeDate: "",
    courseKeyword: "",
    excludeCourseKeyword: "",
  });
};

  // Chọn khóa học
  const [query, setQuery] = useState("");
  const { data: courseSuggestions = [] } = useSearchCoursesQuery(query, {
    skip: query.length < 2,
  });
  const [selectedCourses, setSelectedCourses] = useState([]);

  const handleSelectCourse = (course) => {
    // khi đang chọn tất cả → hủy chế độ tất cả
    if (selectAllCourses) setSelectAllCourses(false);

    if (!selectedCourses.find((c) => c._id === course._id)) {
      setSelectedCourses((prev) => [...prev, course]);
    }

    // clear input
    setQuery("");
  };

  const removeCourse = (id) => {
    setSelectedCourses((prev) => prev.filter((c) => c._id !== id));
  };

  const handleSelectAll = (checked) => {
    setSelectAllCourses(checked);

    if (checked) {
      setSelectedCourses([]);
      setQuery("");
    }
  };

  // Loại trừ khóa học
  const [excludeQuery, setExcludeQuery] = useState("");
  const { data: excludeSuggestions = [] } = useSearchCoursesQuery(
    excludeQuery,
    {
      skip: excludeQuery.length < 2,
    }
  );

  const [excludedCourses, setExcludedCourses] = useState([]);

  const handleSelectExclude = (course) => {
    if (!excludedCourses.find((c) => c._id === course._id)) {
      setExcludedCourses((prev) => [...prev, course]);
    }
    setExcludeQuery("");
  };

  const removeExcludedCourse = (id) =>
    setExcludedCourses((prev) => prev.filter((c) => c._id !== id));

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    afterDate: "",
    beforeDate: "",
    courseKeyword: "",
    excludeCourseKeyword: "",
  });

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
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const handleChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleQuillChange = (value) =>
    setFormData((prev) => ({ ...prev, description: value }));

  const countActiveFilters = Object.values(filters).filter(Boolean).length;

  // ------------------ SUBMIT FORM ----------------------
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      alert("Tiêu đề không được bỏ trống");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      filters: {
        mustInCourses: selectAllCourses
          ? "ALL"
          : selectedCourses.map((c) => c._id),

        enrollmentDate: filters.enrollmentDate
          ? {
              after: formData.afterDate || null,
              before: formData.beforeDate || null,
            }
          : null,

        courseProgress: filters.courseProgress ? selectedProgress : null,

        excludeByCourse: filters.excludeByCourse
          ? excludedCourses.map((c) => c._id)
          : null,
      },
    };

    try {
      const res = await sendAnnouncement(payload).unwrap();

      if (res.success) {
        toast.success("Gửi thông báo thành công!");
      } else {
        toast.warning("Thất bại: " + res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi server! Không thể gửi thông báo.");
    }
  };

  // ------------------ VIEW ----------------------
  return (
    <div className="px-6 py-4 mb-16">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold">Tạo thông báo mới</h1>
      </div>

      <h2 className="text-lg font-semibold mb-2">Người nhận</h2>
      <p className="text-gray-600 text-sm mb-4">
        Xác định học viên bạn muốn gửi thông báo
      </p>

      {/* COURSE SELECT */}

      <label className="text-sm font-medium">Khóa học</label>

      {/* Input tìm kiếm */}
      <input
        type="text"
        value={query}
        placeholder={
          selectAllCourses ? "Đang chọn: Tất cả khóa học" : "Tìm kiếm khóa học"
        }
        className="w-full border rounded-md px-3 py-2 mt-1"
        disabled={selectAllCourses}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* GỢI Ý KHÓA HỌC */}
      {query.length >= 2 &&
        courseSuggestions.length > 0 &&
        !selectAllCourses && (
          <div className="border rounded-md mt-1 bg-white shadow-sm max-h-40 overflow-y-auto">
            {courseSuggestions.map((course) => (
              <div
                key={course._id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectCourse(course)}
              >
                {course.title}
              </div>
            ))}
          </div>
        )}

      {/* TAG ĐÃ CHỌN */}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectAllCourses ? (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 border-blue-300 rounded-full text-sm">
            Tất cả khóa học
          </span>
        ) : (
          selectedCourses.map((course) => (
            <span
              key={course._id}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
            >
              {course.title}
              <button
                className="text-blue-500 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCourse(course._id);
                }}
              >
                ✕
              </button>
            </span>
          ))
        )}
      </div>

      {/* Chọn tất cả */}
      <div className="flex justify-end items-center mt-2">
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={selectAllCourses}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
          Chọn tất cả
        </label>
      </div>

      <div className="h-5"></div>

      {/* FILTER OPTIONS */}
      <h2 className="text-lg font-semibold mb-2">Lọc người nhận theo</h2>

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

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm">Sau ngày</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mt-1"
                onChange={(e) => handleChange("afterDate", e.target.value)}
              />
            </div>

            <div className="flex-1">
              <label className="text-sm">Trước ngày</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 mt-1"
                onChange={(e) => handleChange("beforeDate", e.target.value)}
              />
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
              <label
                key={item.value}
                className="flex items-center gap-2 text-sm"
              >
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

      {/* Exclude Course */}
      {/* Exclude Course */}
      {filters.excludeByCourse && (
        <div className="mb-8">
          <h3 className="font-medium mb-1">Loại trừ theo khóa học</h3>

          {/* Input tìm kiếm */}
          <input
            type="text"
            value={excludeQuery}
            placeholder="Tìm khóa học để loại trừ"
            className="w-full border rounded-md px-3 py-2"
            onChange={(e) => setExcludeQuery(e.target.value)}
          />

          {/* GỢI Ý KHÓA HỌC */}
          {excludeQuery.length >= 2 && excludeSuggestions.length > 0 && (
            <div className="border rounded-md mt-1 bg-white shadow-sm max-h-40 overflow-y-auto">
              {excludeSuggestions.map((course) => (
                <div
                  key={course._id}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectExclude(course)}
                >
                  {course.title}
                </div>
              ))}
            </div>
          )}

          {/* TAG ĐÃ CHỌN */}
          <div className="flex flex-wrap gap-2 mt-2">
            {excludedCourses.map((course) => (
              <span
                key={course._id}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm flex items-center gap-2"
              >
                {course.title}
                <button
                  className="text-red-500"
                  onClick={() => removeExcludedCourse(course._id)}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT */}
      <h2 className="text-lg font-semibold mb-4">Nội dung</h2>

      <div className="mb-4">
        <label className="text-sm font-medium">Tiêu đề</label>
        <input
          type="text"
          placeholder="Nhập tiêu đề (tối đa 65 ký tự)"
          className="w-full border rounded-md px-3 py-2 mt-1"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
        />
      </div>

      <div className="mb-8">
        <label className="text-sm font-medium">Nội dung</label>
        <div className="rounded-[6px] mt-1 focus-within:ring-blue-500 focus-within:ring-1 transition-colors">
          <ReactQuillNew
            theme="snow"
            value={formData.description}
            onChange={handleQuillChange}
            placeholder="Nhập nội dung thông báo"
            modules={{
              toolbar: {
                container: [
                  ["bold", "italic", "underline"],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["link", "image"], // bật link + image
                ],
              },
            }}
          />
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3 pt-6 border-t">
       <button
  onClick={resetForm}
  type="button"
  className="px-4 py-2 rounded-md border"
>
  Hủy
</button>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
        >
          {isLoading ? "Đang gửi..." : "Gửi"}
        </button>
      </div>
    </div>
  );
};

export default CourseAnnouncement;
