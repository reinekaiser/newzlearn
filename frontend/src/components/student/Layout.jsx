import React from 'react'
import Header from "../Header"
import Footer from "../Footer"
import { Outlet } from 'react-router-dom';
import MyCoursesLoader from '@/components/student/home-page/MyCourseLoader';
import SEO from '@/components/SEO';

const Layout = () => {
    return (
        <>
            <SEO
                title="Newzlearn - Nền tảng học trực tuyến linh hoạt và thông minh cho sinh viên và người trẻ bận rộn."
                description="Newzlearn là nền tảng học trực tuyến dành cho sinh viên và người bận rộn tại Việt Nam, mang đến giải pháp tự học thông minh, linh hoạt mọi lúc mọi nơi, giúp bạn kết nối kiến thức, chia sẻ kinh nghiệm và phát triển kỹ năng một cách hiệu quả."
            />

            <MyCoursesLoader />
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </>
    )
}

export default Layout