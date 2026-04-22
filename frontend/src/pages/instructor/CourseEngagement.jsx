import Button from '@/components/Button'
import React, { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetAllCoursesInfoQuery } from '@/redux/api/coursePublicApiSlice';
import { Spinner } from '@/components/ui/spinner';
import MinutesTaught from '@/components/instructor/course-engagement/MinutesTaught';
import CountItems from '@/components/instructor/course-engagement/CountItems';
import CourseStats from '@/components/instructor/course-engagement/CourseStats';
import { CourseComboBox } from '@/components/instructor/course-qa/CourseComboBox';

const CourseEngagement = () => {
    const { data: courses, isLoading: isLoadingCourses } = useGetAllCoursesInfoQuery();
    const [selectedCourse, setSelectedCourse] = useState({ _id: "all", title: "Tất cả khóa học",});

    if (isLoadingCourses) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="size-12" color="#098ce9" />
            </div>
        )
    }
    return (
        <div className='bg-background'>
            <div className="">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-foreground">Mức độ tương tác khóa học</h1>
                        {/* <Select value={selectedCourse} onValueChange={setSelectedCourse} defaultValue="all">
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Chọn khóa học" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả khóa học</SelectItem>
                                {courses?.map((course, id) => (
                                    <SelectItem
                                        key={id}
                                        value={course?._id}
                                        className="truncate max-w-full"
                                    >
                                        {course?.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select> */}
                        <CourseComboBox value={selectedCourse} setValue={setSelectedCourse}></CourseComboBox>
                    </div>
                </div>
            </div>
            <div className="space-y-8 container mx-auto px-6">
                <MinutesTaught selectedCourse={selectedCourse._id} />
                <CountItems selectedCourse={selectedCourse._id} />
                <CourseStats selectedCourse={selectedCourse._id} />
            </div>
        </div>
    )
}

export default CourseEngagement