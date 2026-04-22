import Button from "@/components/Button";
import { CheckCircle, XCircle } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

function MomoSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { courseAlias } = useParams();

  const resultCode = searchParams.get("resultCode");
  const messageParam = searchParams.get("message");

  const isSuccess = ["0", "1006", "7002"].includes(resultCode);

  const message = isSuccess
    ? "Thanh toán MoMo thành công. Khóa học đã được kích hoạt."
    : messageParam
    ? decodeURIComponent(messageParam)
    : "Thanh toán MoMo thất bại hoặc đã bị hủy.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          {isSuccess ? (
            <CheckCircle className="w-20 h-20 text-[#098BE4]" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500" />
          )}
        </div>

        {/* Title */}
        <h1
          className={`text-2xl font-bold mb-2 ${
            isSuccess ? "text-[#098BE4]" : "text-gray-800"
          }`}
        >
          {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">{message}</p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isSuccess ? (
            <>
              <button
                onClick={() => navigate(`/student/learning/${courseAlias}`)}
                className="
                  w-full py-3 rounded-md
                  bg-[#098BE4] text-white
                  font-semibold hover:bg-[#0069D9]
                  transition shadow-md
                "
              >
                Vào khóa học của tôi
              </button>

              <Button variant="outline" onClick={() => navigate("/")}>
                Về trang chủ
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(`/course/${courseAlias}`)}
                className="
                  w-full py-3 rounded-xl
                  bg-gray-200 hover:bg-gray-300
                  transition font-medium
                "
              >
                Quay lại khóa học
              </button>

              <button
                onClick={() => navigate(`/course/${courseAlias}/payment`)}
                className="
                  w-full py-3 rounded-xl
                  bg-red-500 text-white
                  hover:bg-red-600
                  transition font-medium
                "
              >
                Thanh toán lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MomoSuccess;
