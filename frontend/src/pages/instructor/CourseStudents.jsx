import { CourseComboBox } from "@/components/instructor/course-qa/CourseComboBox";
import StudentProfile from "@/components/instructor/course-students/StudentProfile";
import { Spinner } from "@/components/ui/spinner";
import { useGetStudentsInCourseQuery } from "@/redux/api/studentApiSlice";
import { skipToken } from "@reduxjs/toolkit/query";
import React, { useState } from "react";

function CourseStudents() {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const { data: students, isLoading } = useGetStudentsInCourseQuery(
    selectedCourse ? selectedCourse._id : skipToken
  );
  if (isLoading)
    return (
      <div className="flex h-full items-center justify-center z-50">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );
  return (
    <div className="bg-white px-6 py-4 overflow-y-auto mb-16">
      <div className="flex items-center space-x-10 mb-5">
        <h1 className="text-2xl font-semibold">Học viên</h1>
        <CourseComboBox
          value={selectedCourse}
          setValue={setSelectedCourse}
          hasAll={false}
        />
      </div>
      <p className="my-5">
        <span className="font-semibold text-[1.6rem]">
          {students?.length || 0}
        </span>{" "}
        học viên
      </p>
      <div className="w-full p-5 mx-auto overflow-y-auto outline outline-1 rounded-lg">
        {students && students?.length <= 0 ? (
          <div className="flex w-full justify-center items-center h-[300px]">
            <p>Chưa có học viên nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {students?.map((order, index) => {
              return <StudentProfile order={order} key={index} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseStudents;
