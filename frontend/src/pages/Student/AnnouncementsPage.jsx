import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "react-router-dom";

export default function AnnouncementsPage() {
  return (
      <>
      <Header />
      <div className="flex bg-white">
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
      <div className="flex-1 p-10">

        {/* HEADER + CREATE BUTTON */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-semibold">Thông báo</h1>

          <Link
            to="/announcements/create"
            className="px-4 py-2 bg-[#098be4] text-white rounded-md hover:bg-blue-400 transition"
          >
            + Tạo thông báo mới
          </Link>
        </div>

        {/* EMPTY STATE */}
        <div className="flex flex-col items-center justify-center mt-20 text-center">
          <img
            src="/empty-announcement.png"
            alt="Empty"
            className="w-60 opacity-80 mb-4 object-contain" />

          <h2 className="text-lg font-semibold mb-2">Chưa có thông báo nào</h2>

          <p className="text-gray-600 max-w-md text-sm">
            Đây là nơi bạn có thể gửi thông báo email đến học viên mỗi tháng.
            Dùng thông báo giáo dục để hỗ trợ học tập hoặc quảng bá khóa học của bạn.
            <a href="#" className="text-[#098be4] ml-1 underline">
              Tìm hiểu thêm
            </a>
          </p>
        </div>

      </div>
    </div>
      <Footer />
    </>
  );
}
