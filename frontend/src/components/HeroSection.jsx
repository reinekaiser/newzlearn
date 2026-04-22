// Hero.jsx
import { Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import Button from "./Button";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";

export default function HeroSection() {
    const user = useSelector((state) => state.auth.userInfo);
    const navigate = useNavigate()
    const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    
    const handleExploreCourses = () => {
      navigate('/courses?q=');
    }

    const handleMyCourses = () => {
      navigate('/student/my-courses');
    }
    
    const handleOpenSignIn = () => {
      setIsSignInModalOpen(true);
    };
    
    const handleOpenSignUp = () => {
      setIsSignUpModalOpen(true);
    };
    
    const handleCloseSignIn = () => {
      setIsSignInModalOpen(false);
    };
    
    const handleCloseSignUp = () => {
      setIsSignUpModalOpen(false);
    };
    
    const handleSwitchToSignUp = () => {
      setIsSignInModalOpen(false);
      setIsSignUpModalOpen(true);
    };
    
    const handleSwitchToSignIn = () => {
      setIsSignUpModalOpen(false);
      setIsSignInModalOpen(true);
    };
    
  return (
    <section className="w-full bg-white h-full py-12">
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Left content */}
        <div className="flex-1 space-y-6 text-center lg:text-left">
          {user ? (
            // Nội dung khi đã đăng nhập
            <>
              <p className="uppercase tracking-wider text-gray-600 font-semibold">
                Chào mừng trở lại, {user.firstName || user.email}!
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                Hãy tiếp tục hành trình học tập của bạn{" "}
                <span className="text-[#098be4] font-extrabold">ngay hôm nay</span>
              </h1>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="reverse" onClick={handleMyCourses}>
                  Tiếp tục học tập
                </Button>
                <Button variant="default" onClick={handleExploreCourses}>
                  Khám phá khóa học mới
                </Button>
              </div>
            </>
          ) : (
            // Nội dung khi chưa đăng nhập
            <>
              <p className="uppercase tracking-wider text-gray-600 font-semibold">
                Ưu đãi đặc biệt dành cho học viên
              </p>
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                Tận hưởng hơn{" "}
                <span className="text-[#098be4] font-extrabold">1,2 nghìn khóa học</span> <br />
                dành cho người sáng tạo{" "}
                <span className="text-green-600 font-extrabold">miễn phí</span>
              </h1>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="reverse" onClick={handleExploreCourses}>
                  Khám phá các gói khóa học
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto"
                    onClick={handleOpenSignIn}
                  >
                    Đăng nhập
                  </Button>
                  <Button 
                    variant="default" 
                    className="w-full sm:w-auto"
                    onClick={handleOpenSignUp}
                  >
                    Đăng ký ngay
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right content */}
        <div className="relative mt-10 lg:mt-0">
          {/* Background accent */}
          <div className="absolute -top-6 -left-6 bg-blue-100 rounded-lg -z-10"></div>

          {/* Image */}
          <img
            src="https://eduma.thimpress.com/demo-online-learning/wp-content/uploads/sites/104/2024/07/banner-learning.png"
            alt="Student"
            className="rounded-lg w-[500px] h-[500px] bg-blue-300"
          />

          {/* Rating badge */}
          <div className="absolute bottom-4 left-4 bg-white shadow-md rounded-lg px-4 py-2 flex items-center space-x-3">
            <span className="flex items-center bg-yellow-400 text-white font-bold px-2 py-1 rounded">
              <Star className="mr-1" /> 4.85
            </span>
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Đánh giá trung bình</span> <br />
              183,406 đánh giá từ học viên
            </p>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      <SignInModal 
        isOpen={isSignInModalOpen}
        onClose={handleCloseSignIn}
        onSwitchToSignUp={handleSwitchToSignUp}
      />
      <SignUpModal 
        isOpen={isSignUpModalOpen}
        onClose={handleCloseSignUp}
        onSwitchToSignIn={handleSwitchToSignIn}
      />
    </section>
  );
}
