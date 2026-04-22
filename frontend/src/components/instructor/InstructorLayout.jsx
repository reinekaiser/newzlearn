import { useState, useEffect, useMemo } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { MdOutlineMessage, MdKeyboardArrowRight } from "react-icons/md";
import { MdLiveTv } from "react-icons/md";
import { FaChartBar, FaRegBell } from "react-icons/fa";
import { RiLiveLine } from "react-icons/ri";
const NavItem = ({ buttonContennt, linkTo, Dropdown }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    return (
        <>
            <div
                className="py-2 relative"
                onMouseEnter={() => setShowDropdown(true)}
                onMouseLeave={() => setShowDropdown(false)}
            >
                <Link to={linkTo} className="px-3 h-10 flex items-center justify-between  rounded-lg hover:bg-[#dff1fe]">
                    {buttonContennt}
                </Link>
                {showDropdown && <div className="absolute top-[52px] right-0">{Dropdown}</div>}
            </div>
        </>
    );
};

const InstructorLayout = () => {
    const location = useLocation();

    const MENU_ITEMS = [
        {
            title: "Khóa học",
            to: "/instructor/courses",
            icon: <MdLiveTv className="text-lg" />,
        },
        {
            title: "Buổi học live",
            to: "/instructor/sessions",
            icon: <RiLiveLine className="text-lg" />,
        },
        {
            title: "Giao tiếp",
            icon: <MdOutlineMessage />,
            submenu: [
                {
                    title: "Hỏi & Đáp",
                    to: "/instructor/communication/qa",
                },
                {
                    title: "Thông báo",
                    to: "/instructor/communication/announcements",
                },
            ],
        },
        {
            title: "Hiệu suất",
            icon: <FaChartBar />,
            submenu: [
                {
                    title: "Tổng quan",
                    to: "/instructor/performance/overview",
                },
                {
                    title: "Học viên",
                    to: "/instructor/performance/students",
                },
                {
                    title: "Review",
                    to: "/instructor/reviews",
                },
                {
                    title: "Tương tác khoá học",
                    to: "/instructor/performance/engagement",
                },
            ],
        },
    ];

    return (
        <>
            <header className="flex items-center justify-between border-b-[1.5px] border-gray-200">
                <Link to={"/instructor"}>
                    <img src="/logo_with_text.png" alt="NewZLearn" className="h-[46px]" />
                </Link>
                <div className="flex items-center">
                    <NavItem
                        buttonContennt={<span className="text-grayText">Học viên</span>}
                        linkTo={"/"}
                        Dropdown={<div className="w-[280px] px-3 py-4 border rounded-lg bg-white border-gray-100 shadow-sm shadow-primary/10">
                            <p className="text-center text-[14px] text-grayText">Chuyển sang chế độ ở đây để - Quay trở lại các khóa học mà bạn đang tham gia.</p>
                        </div>}
                    ></NavItem>
                    <NavItem
                        buttonContennt={<FaRegBell className="text-grayText"/>}
                        linkTo={"/"}
                        Dropdown={<div className="w-[280px] px-3 py-4 border rounded-lg bg-white border-gray-100 shadow shadow-primary/20">
                            <p className="text-center text-[14px] text-grayText">Chuyển sang chế độ ở đây để - Quay trở lại các khóa học mà bạn đang tham gia.</p>
                        </div>}
                    ></NavItem>
                    <NavItem
                        buttonContennt={<div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">A</div>}
                        linkTo={"/"}
                        Dropdown={<div className="w-[280px] px-3 py-4 border rounded-lg bg-white border-gray-100 shadow shadow-primary/20">
                            <p className="text-center text-[14px] text-grayText">Chuyển sang chế độ ở đây để - Quay trở lại các khóa học mà bạn đang tham gia.</p>
                        </div>}
                    ></NavItem>
                </div>
            </header>
            <div className="flex">
                <div
                    className={`sticky top-0 left-0 h-screen w-[18%] border-r-gray-300 border-r-[1.5px] `}
                >
                    <nav>
                        <ul className="flex flex-col gap-1">
                            {MENU_ITEMS.map((item, index) => {
                                const isActive = location.pathname === item.to;

                                return (
                                    <li key={index}>
                                        {item.submenu ? (
                                            <>
                                                <button
                                                    className={`flex justify-between items-center w-full h-12 px-4`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 flex items-center justify-center">
                                                            {item.icon}
                                                        </div>
                                                        <span>{item.title}</span>
                                                    </div>
                                                    <MdKeyboardArrowRight
                                                        className={`transition-transform duration-300 text-[18px] rotate-90`}
                                                    />
                                                </button>
                                                <ul className="flex flex-col">
                                                    {item.submenu.map((sub, subIdx) => (
                                                        <li key={subIdx}>
                                                            <Link
                                                                to={sub.to}
                                                                className={`block  pl-12 py-2.5 hover:bg-[#dff1fe] ${
                                                                    location.pathname === sub.to
                                                                        ? "bg-[#dff1fe]"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {sub.title}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </>
                                        ) : (
                                            <Link
                                                to={item.to}
                                                className={`flex gap-3 items-center h-12 px-4 hover:bg-[#dff1fe] ${
                                                    isActive
                                                        ? "bg-[#dff1fe] border-r-2 border-primary"
                                                        : ""
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-5 h-5 flex items-center justify-center">
                                                        {item.icon}
                                                    </div>
                                                    <span>{item.title}</span>
                                                </div>
                                            </Link>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>
                </div>
                <div className={`flex-1 w-full"`}>
                    <Outlet />
                </div>
            </div>
        </>
    );
};

export default InstructorLayout;
