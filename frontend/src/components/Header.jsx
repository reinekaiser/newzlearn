import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Heart } from "lucide-react";
import Button from "./Button.jsx";
import { useState, useEffect, useRef, use } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/features/authSlice";
import SignInModal from "./SignInModal";
import SignUpModal from "./SignUpModal";
import { useGetCourseSearchSuggestionQuery } from "@/redux/api/coursePublicApiSlice.js";
import { skipToken } from '@reduxjs/toolkit/query';
import { LuDot } from "react-icons/lu";
import MyCourseDropdown from "@/components/student/home-page/MyCourseDropdown.jsx";
import UserDropDown from "./UserDropDown.jsx";
import { useGetMyFavoritesQuery } from "@/redux/api/favoriteApiSlice";

export default function Header({ q }) {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.userInfo);
  const [searchQuery, setSearchQuery] = useState(q || "");
  const [openDropDown, setOpenDropDown] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [openSearchSuggestion, setOpenSearchSuggestion] = useState(false);
  const [openMycourseDropdown, setOpenMycourseDropdown] = useState(false);
  const { data: searchSuggestions, error, isLoading: isSearching } = useGetCourseSearchSuggestionQuery(
    searchQuery ? { q: searchQuery } : skipToken,
  );

  useEffect(() => {
    setSearchQuery(q || "");
  }, [q]);
  
  // Lấy danh sách yêu thích để hiển thị badge trên icon Heart
  const { data: favorites = [] } = useGetMyFavoritesQuery(undefined, {
    skip: !user, // Chỉ gọi API khi đã đăng nhập
  });

  const handleSearch = () => {
    const param = new URLSearchParams()
    param.set("q", searchQuery)
    setOpenSearchSuggestion(false)
    navigate(`/courses?${param.toString()}`)
  };
  const handleCart = () => { };

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

  const inputRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setOpenSearchSuggestion(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [searchQuery, openSearchSuggestion, searchSuggestions]);

  return (
    <header className="sticky top-0 w-full shadow-lg bg-white z-50">
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 gap-8">
        {/* Logo */}
        <div className="flex items-center space-x-4 min-w-3xl">
          <Link to="/">
            <img
              src={"/logo_with_text.png"}
              alt="Logo"
              className="w-[120px] h-[30px]"
            />
          </Link>
          <Button
            variant="default"
            className="h-full text-sm relative"
            onClick={handleSearch}
          >
           Khám Phá
          </Button>
          {/* Search */}
          <div className="flex-1 mx-2">
            <div ref={inputRef} className="relative flex items-center border-2 border-gray-300 rounded-full px-3 py-2 focus-within:border-[#098be4]">
              <Search
                className="text-gray-500 rounded p-1 cursor-pointer hover:text-[#098be4] hover:bg-[#cee8fb]"
                onClick={handleSearch}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenSearchSuggestion(true)

                }}
                placeholder="Tìm kiếm bất kì thứ gì..."
                className="flex-1 px-2 outline-none text-sm"
                onKeyDown={(e) => {
                  e.key === "Enter" && handleSearch();
                }}
              />
              <div className='absolute left-0 top-full mt-1 w-full z-10 rounded-lg'>
                {openSearchSuggestion && !isSearching &&
                  searchQuery != "" &&
                  (searchSuggestions?.keywords.length > 0 || searchSuggestions?.courses.length > 0) && (
                    <div className='border border-gray-100 bg-white shadow-lg rounded-lg'>
                      <DropDownSuggestion 
                        searchSuggestions={searchSuggestions} 
                        setOpen={setOpenSearchSuggestion} 
                        setSearchQuery={setSearchQuery}
                        />
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center text-sm">
          {!user ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="text-sm w-28"
                onClick={handleOpenSignIn}
              >
                Đăng nhập
              </Button>
              <Button
                variant="reverse"
                className="text-sm w-28"
                onClick={handleOpenSignUp}
              >
                Đăng ký
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to={"/student/wishlist"} className="relative group">
                <Heart size={22} className="text-gray-700 hover:text-red-500 transition-colors"/>
                {/* Badge số lượng yêu thích */}
                {/* {favorites.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {favorites.length > 99 ? "99+" : favorites.length}
                  </span>
                )} */}
                {/* Tooltip */}
                <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Danh sách yêu thích
                </span>
              </Link>
              {user.role === 'user' ? <div
                className="relative inline-block"
                onMouseEnter={() => setOpenMycourseDropdown(true)}
                onMouseLeave={() => setOpenMycourseDropdown(false)}
              >              
                <Button className="text-gray-700">Học tập</Button>

                {openMycourseDropdown && (
                  <div className="absolute right-0">
                    <div className=" border border-gray-100 mt-2 bg-white shadow-lg rounded-lg px-2">
                      <div>
                        <MyCourseDropdown key={user?._id}/>
                      </div>
                    </div>
                  </div>
                )}
              </div> : 
              <Link to={"/instructor"}>
                <Button className="text-gray-700">Giảng dạy</Button>
              </Link>}
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">
                  Xin chào, {user.firstName || user.email}
                </span>
                <UserDropDown user={user} />
              </div>
            </div>
          )}
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
    </header>
  );
}

const DropDownSuggestion = ({ searchSuggestions, setOpen, setSearchQuery }) => {

  const navigate = useNavigate()

  const onClickKeyword = (keyword) => {
    const param = new URLSearchParams()
    param.set("q", keyword)
    setOpen(false)
    setSearchQuery(keyword)
    navigate(`/courses?${param.toString()}`)
  }

  const onClickCourse = (courseAlias) => {
    navigate(`/course/${courseAlias}`)
  }
  
  return (
    <div>
      {searchSuggestions?.keywords.length > 0 && (
        <div>
          {searchSuggestions?.keywords.map((keyword, index) => (
            <div
              key={index}
              className='hover:bg-gray-100 font-semibold py-3 px-4 duration-300 text-base flex items-center gap-3 cursor-pointer'
              onClick={() => {
                onClickKeyword(keyword);
              }}
            >
              <Search
                className="text-gray-500 rounded p-1 cursor-pointer hover:text-[#098be4] hover:bg-[#cee8fb]"
              />
              {keyword}
            </div>
          ))}

          {searchSuggestions?.courses.map((course, index) => (
            <div
              key={index}
              className='hover:bg-gray-100 py-3 px-4 duration-300 text-base flex items-center gap-3 cursor-pointer'
              onClick={() => {
                onClickCourse(course?.alias);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-15 h-8 shrink-0 rounded overflow-hidden">
                  <img
                    src={course?.thumbnail?.publicURL || "/logo.png"}
                    alt=""
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="flex flex-col">
                  <p className="text-base font-semibold leading-tight">
                    {course.title}
                  </p>
                  <span className="flex items-center text-xs text-gray-600">
                    {course.language}
                    <LuDot className="text-lg mx-1" />
                    {course.level}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
