import { XCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

export default function VNPayFailed() {
  const { courseAlias } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <XCircle className="w-20 h-20 text-red-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Thanh toán thất bại
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          Giao dịch không thành công hoặc đã bị hủy.
          <br />
          Bạn có thể thử lại hoặc chọn phương thức thanh toán khác.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(`/course/${courseAlias}`)}
            className="w-full py-3 rounded-xl bg-gray-200 hover:bg-gray-300 transition font-medium"
          >
            Quay lại khóa học
          </button>

          <button
            onClick={() => navigate(`/course/${courseAlias}/payment`)}
            className="w-full py-3 rounded-xl bg-red-500 text-white hover:bg-red-600 transition font-medium"
          >
            Thanh toán lại
          </button>
        </div>
      </div>
    </div>
  );
}
