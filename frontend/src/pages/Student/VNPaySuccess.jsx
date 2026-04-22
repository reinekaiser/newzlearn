import React from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "@/components/Button";

const VNPaySuccess = () => {
const { courseAlias } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full">
        <CheckCircle className="mx-auto mb-4 text-[#098BE4] w-20 h-20" />
        
        <h1 className="text-2xl font-bold text-[#098BE4] mb-2">
          Thanh toán thành công 
        </h1>

        <p className="text-gray-600 mb-6">
          Cảm ơn bạn đã mua khóa học.  
          Khóa học đã được kích hoạt trong tài khoản của bạn.
        </p>

        <div className="flex flex-col gap-3">
         <button
  onClick={() => navigate(`/student/learning/${courseAlias}`)}
  className="
    w-full
    py-3
    rounded-md
    bg-[#098BE4]
    text-white
    font-semibold
    text-base
    hover:bg-[#0069D9]
    transition
    shadow-md
  "
>
  Vào khóa học của tôi
</button>

          <Button
            variant="outline"
            onClick={() => navigate("/")}
          >
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VNPaySuccess;
