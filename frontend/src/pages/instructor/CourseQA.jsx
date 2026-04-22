import { CourseComboBox } from "@/components/instructor/course-qa/CourseComboBox";
import QnADetail from "@/components/instructor/course-qa/QnADetail";
import QuestionCard from "@/components/instructor/course-qa/QuestionCard";
import SortComboBox from "@/components/instructor/course-qa/SortComboBox";
import { Spinner } from "@/components/ui/spinner";
import {
  useGetQnAByCourseIdQuery,
  useGetQnAByInstructorQuery,
} from "@/redux/api/qnaSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import React, { useEffect, useMemo, useState } from "react";

function CourseQA() {
  // -------------- state --------------------
  const [selectedCourse, setSelectedCourse] = useState({
    _id: "all",
    title: "Tất cả khóa học",
  });
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState([
    {
      label: "Chưa đọc",
      value: false,
    },
    {
      label: "Chưa trả lời",
      value: false,
    },
  ]);
  const [filter2, setFilter2] = useState("Mới nhất");

  const [selectedQnA, setSelectedQnA] = useState(null);
  // --------------- api --------------------
  const { data: courseQA, isLoading: isLoadingCourseQA } =
    useGetQnAByCourseIdQuery(
      selectedCourse._id !== "all" ? selectedCourse._id : skipToken
  );
  const { data: all, isLoading: isLoadingAll } = useGetQnAByInstructorQuery();

  // ------------- fetch ---------------------
  useEffect(() => {
    if (selectedCourse._id === "all") {
      if (all) setList(all);
      else setList([]);
    } else {
      if (courseQA) setList(courseQA);
      else setList([]);
    }
  }, [selectedCourse, all, courseQA]);

  // -------------- filter --------------------
  const filteredList = useMemo(() => {
    let result = [...list];

    filter.forEach((f) => {
      if (f.value === true) {
        if (f.label === "Chưa đọc") {
          result = result.filter((x) => x.isRead === false);
        } else if (f.label === "Chưa trả lời") {
          result = result.filter((x) => x.isSolved === false);
        }
      }
    });

    if (filter2 === "Mới nhất") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (filter2 === "Cũ nhất") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }
    if (filter2 === "Nhiều bình luận nhất") {
      result.sort(
        (a, b) => (b.comments?.length || 0) - (a.comments?.length || 0)
      );
    }
    return result;
  }, [list, filter, filter2]);

  // -------------- loading -----------------
  if (isLoadingAll || isLoadingCourseQA)
    return (
      <div className="flex h-full items-center justify-center z-50">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );
  // -------------- main component -----------------
  return (
    <div className="bg-white px-6 py-4 overflow-y-auto overflow-x-auto mb-16">
      <div className="flex items-center space-x-10 mb-5">
        <h1 className="text-2xl font-semibold">Hỏi & Đáp</h1>
        <CourseComboBox value={selectedCourse} setValue={setSelectedCourse} />
      </div>
      {list.length === 0 ? (
        <div className="text-gray-500">Không có câu hỏi nào.</div>
      ) : (
        <div className="w-full flex-col">
          <div className="flex items-center space-x-4">
            {filter.map((f, index) => {
              return (
                <label key={f.label} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={f.value}
                    className="accent-blue-500"
                    onChange={(e) => {
                      setFilter((prev) =>
                        prev.map((item, i) =>
                          i === index
                            ? { ...item, value: e.target.checked }
                            : item
                        )
                      );
                    }}
                  />
                  {f.label}
                </label>
              );
            })}
          </div>
          <div className="flex items-center space-x-4 py-4">
            <p>Sắp xếp theo:</p>
            <SortComboBox value={filter2} setValue={setFilter2} />
          </div>
          <div className="w-full h-[420px] flex rounded-md border-1">
            <div className="w-1/4 h-full overflow-y-auto border-r-[2px] flex-shrink-0">
              {filteredList.map((qna, index) => {
                return (
                  <QuestionCard
                    key={index}
                    qna={qna}
                    selected={selectedQnA}
                    setSelected={setSelectedQnA}
                  />
                );
              })}
            </div>
            <div className="w-3/4 overflow-y-auto overflow-x-hidden min-w-0">
              {" "}
              <QnADetail selectedId={selectedQnA} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseQA;
