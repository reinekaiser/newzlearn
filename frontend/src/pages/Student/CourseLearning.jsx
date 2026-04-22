import React, { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Spinner } from '@/components/ui/spinner'
import CoursePlayer from '@/components/student/course-learning/CoursePlayer'
import Header from '@/components/student/course-learning/Header'
import { QnASheet } from '@/components/student/qna/QnASheet'
import SectionsAccordion from '@/components/student/course-learning/SectionsAccordion'
import { ChatbotPanel, ChatbotToggleButton } from '@/components/student/course-learning/ChatbotWidget'
import { useGetCourseByAliasQuery } from '@/redux/api/coursePublicApiSlice'
import { useGetItemsProgressQuery } from '@/redux/api/progressApiSlice'
import { skipToken } from '@reduxjs/toolkit/query'

const CourseLearning = () => {
    const params = useParams()
    const { data: course, isLoading: isCourseLoading } = useGetCourseByAliasQuery(params.courseAlias)
    const { data: itemsProgress, isLoading: isProgressLoading } = useGetItemsProgressQuery(course?._id ?? skipToken);

    const [isSwitching, setIsSwitching] = useState(false);


    const latestProgress = useMemo(() => {
        if (!course) return null
        if (!itemsProgress || itemsProgress.length === 0) {
            const firstSection = course.sections?.[0]
            const firstItem = firstSection?.curriculumItems?.[0]
            return firstItem ? { itemId: firstItem._id, itemType: firstItem.itemType } : null
        }
        const sorted = [...itemsProgress].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return sorted[0];
    }, [course, itemsProgress])
    const [currentItem, setCurrentItem] = useState(null)
    const [currentSectionId, setCurrentSectionId] = useState(null)
    const [isDone, setIsDone] = useState(false);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    
    const handleDoneChange = (done) => {
        setIsDone(done);
    };
    useEffect(() => {
        if (latestProgress?.itemId && latestProgress?.itemType) {
            setCurrentItem({ itemId: latestProgress.itemId, itemType: latestProgress.itemType })
        }
    }, [latestProgress])

    // Cập nhật currentSectionId khi currentItem thay đổi
    useEffect(() => {
        if (currentItem && course?.sections) {
            const section = course.sections.find(sec =>
                sec.curriculumItems?.some(item => item._id === currentItem.itemId)
            )
            if (section) {
                setCurrentSectionId(section._id)
            }
        }
    }, [currentItem, course?.sections])

    const handleChangeItem = (itemId, itemType) => {
        if (isSwitching) return;
        if(currentItem?.itemId === itemId) return;
        setIsSwitching(true);

        setIsDone(false);
        setTimeout(() => {
            setCurrentItem({ itemId, itemType });
            setIsSwitching(false);
        }, 1000);
    };

    if (isCourseLoading || isProgressLoading || !currentItem || isSwitching) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner className="size-12" color="#098ce9" />
            </div>
        )
    }


    return (
        <div className="min-h-screen flex flex-col">
            <Header 
                courseTitle={course.title} 
                courseId={course._id} 
                lectureId={currentItem?.itemId}
                sectionId={currentSectionId}
            />
            <div className="grow flex">
                {/* Q&A Sheet Button */}
                <div className='fixed bottom-5 left-5 z-50'>
                    <QnASheet courseId={course?._id} lectureId={currentItem?.itemId}/>
                </div>
                
                {/* Sections Accordion - Left sidebar */}
                <div className="w-72 shrink-0 h-[calc(100vh-64px)] overflow-auto border-r border-gray-200">
                    <SectionsAccordion
                        courseId = {course._id}
                        sections={course.sections}
                        handleChangeItem={handleChangeItem}
                        currentItem={currentItem}
                        isDone={isDone}
                    />
                </div>

                {/* Course Player - Main content */}
                <div className={`flex-1 h-[calc(100vh-64px)] overflow-auto transition-all duration-300`}>
                    <CoursePlayer
                        key={`${currentItem.itemId}-${currentItem.itemType}}`}
                        itemId={currentItem.itemId}
                        itemType={currentItem.itemType}
                        onDoneChange={handleDoneChange}
                    />
                </div>

                {/* Chatbot Panel - Right sidebar (when open) */}
                <div 
                    className={`h-[calc(100vh-64px)] shrink-0 transition-all duration-300 overflow-hidden ${
                        isChatbotOpen && currentItem.itemType === 'Lecture' ? 'w-75' : 'w-0'
                    }`}
                >
                    {isChatbotOpen && currentItem.itemType === 'Lecture' && (
                        <ChatbotPanel
                            key={`${currentItem.itemId}-${currentItem.itemType}}`}
                            lectureId={currentItem.itemId}
                            isOpen={isChatbotOpen}
                            onClose={() => setIsChatbotOpen(false)}
                        />
                    )}
                </div>
            </div>
            
            {/* Chatbot Toggle Button */}
            {currentItem.itemType === 'Lecture' && <ChatbotToggleButton 
                isOpen={isChatbotOpen} 
                onClick={() => setIsChatbotOpen(!isChatbotOpen)} 
            />}
        </div>
    )
}

export default CourseLearning