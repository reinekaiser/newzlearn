import { Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#cee8fb] text-[#098be4] py-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Cột 1: Logo + Thông tin liên hệ */}
        <div className="flex flex-col space-y-2">
          <img
            src={"/logo_with_text.png"}
            alt="Logo"
            className="mb-4 w-[300px] h-auto"
          />
          <h3 className="font-semibold mb-4">THÔNG TIN LIÊN HỆ</h3>
          <a
            className="mb-3 flex items-center gap-2 cursor-pointer"
            target="_blank"
            href="tel:0909707662"
          >
            <Phone className="text-[#098be4]" />
            090 970 7662
          </a>
          <a
            className="mb-3 flex items-center gap-2 cursor-pointer"
            target="_blank"
            href="mail:22521641@gm.uit.edu.vn"
          >
            <Mail className="text-blue-400" />
            22521641@gm.uit.edu.vn
          </a>
          <p className="flex items-start gap-2">
            <MapPin className="text-blue-400 mt-1" />
            Khu phố 34, Phường Linh Xuân, Thành phố Hồ Chí Minh.
          </p>
        </div>

        {/* Cột 2: Các danh mục */}
        <div>
          <div className="mb-4 h-[75px]"></div>
          <h3 className="font-semibold mb-4">CÁC DANH MỤC</h3>
          <ul className="grid grid-cols-2 space-y-2">
            <li>
              <a href="#">Các khoá học</a>
            </li>
            <li>
              <a href="#">Các cuộc thi</a>
            </li>
            <li>
              <a href="#">Diễn đàn</a>
            </li>
            <li>
              <a href="#">Chứng chỉ</a>
            </li>
            <li>
              <a href="#">Giới thiệu</a>
            </li>
            <li>
              <a href="#">Tin tức</a>
            </li>
            <li>
              <a href="#">Hỗ trợ</a>
            </li>
            <li>
              <a href="#">Tài liệu</a>
            </li>
          </ul>
        </div>

        {/* Cột 3: App Store / Google Play */}
        <div>
          <div className="mb-4 h-[75px]"></div>
          <h3 className="font-semibold mb-4">
            MẠNG XÃ HỘI
          </h3>
          <div className="flex gap-4">
            <a target="_blank" href="https://facebook.com">
              <img
                src="https://1.bp.blogspot.com/-S8HTBQqmfcs/XN0ACIRD9PI/AAAAAAAAAlo/FLhccuLdMfIFLhocRjWqsr9cVGdTN_8sgCPcBGAYYCw/s1600/f_logo_RGB-Blue_1024.png"
                alt="Facebook"
                className="w-12 h-12 rounded"
              />
            </a>
            <a target="_blank" href="https://youtube.com">
              <img
                src="https://www.freepnglogos.com/uploads/youtube-logo-icon-transparent---32.png"
                alt="Youtube"
                className="h-12"
              />
            </a>
            <a target="_blank" href="https://tiktok.com">
              <img
                src="https://static.vecteezy.com/system/resources/previews/021/495/942/large_2x/tiktok-logo-icon-free-png.png"
                alt="Tiktok"
                className="h-12"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
