import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useVerifyEmailMutation, useResendVerificationEmailMutation } from "../../redux/api/authSlice";
import { toast } from "react-toastify";
import { FaCheckCircle, FaTimesCircle, FaEnvelope, FaSpinner, FaInfoCircle } from "react-icons/fa";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendVerificationEmail, { isLoading: isResending }] = useResendVerificationEmailMutation();
  const [verificationStatus, setVerificationStatus] = useState("pending"); // pending, success, error, alreadyVerified
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (token) {
      handleVerifyEmail();
    } else {
      setVerificationStatus("error");
    }
  }, [token]);

  const handleVerifyEmail = async () => {
    try {
      const response = await verifyEmail(token).unwrap();
      setVerificationStatus("success");
      toast.success(response.message || "Email đã được xác nhận thành công!", {
        position: "bottom-right",
      });
      setTimeout(() => navigate("/"), 3000);
    } catch (error) {
      console.error("Verification error:", error);
      const message = error?.data?.message;
      const errorCode = error?.data?.code;

      // Kiểm tra nếu token đã được sử dụng hoặc email đã được xác nhận
      if (
        errorCode === "TOKEN_ALREADY_USED" ||
        message?.toLowerCase().includes("đã được sử dụng") ||
        message?.toLowerCase().includes("already verified") ||
        message?.toLowerCase().includes("đã được xác nhận trước đó")
      ) {
        // Trường hợp token đã được dùng hoặc email đã xác nhận trước đó
        setVerificationStatus("alreadyVerified");
        
      } else {
        setVerificationStatus("error");
        toast.error(message || "Token xác nhận không hợp lệ hoặc đã hết hạn", {
          position: "bottom-right",
        });
      }
    }
  };

  const handleResendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Vui lòng nhập email của bạn", { position: "bottom-right" });
      return;
    }

    try {
      await resendVerificationEmail({ email }).unwrap();
      toast.success("Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.", {
        position: "bottom-right",
      });
    } catch (error) {
      toast.error(
        error?.data?.message || "Không thể gửi email. Vui lòng thử lại sau.",
        { position: "bottom-right" }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Đang xác nhận */}
        {verificationStatus === "pending" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaSpinner className="text-blue-600 text-3xl animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Đang xác nhận email...</h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {/* Thành công */}
        {verificationStatus === "success" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-green-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận thành công!</h2>
            <p className="text-gray-600 mb-6">
              Email của bạn đã được xác nhận. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#27B5FC] to-[#098be4] text-white rounded-xl hover:from-[#098be4] hover:to-[#27B5FC] transition-all duration-200 font-semibold"
            >
              Đăng nhập ngay
            </Link>
            <p className="text-sm text-gray-500 mt-4">
              Bạn sẽ được chuyển hướng tự động sau 3 giây...
            </p>
          </div>
        )}

        {/* Đã xác nhận trước đó / Token đã được sử dụng */}
        {verificationStatus === "alreadyVerified" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaInfoCircle className="text-blue-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Tài khoản đã được xác nhận thành công
            </h2>
            <p className="text-gray-600 mb-6">
              Link xác nhận này đã được sử dụng. Email của bạn đã được xác nhận thành công. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#27B5FC] to-[#098be4] text-white rounded-xl hover:from-[#098be4] hover:to-[#27B5FC] transition-all duration-200 font-semibold"
            >
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {/* Token lỗi / hết hạn */}
        {verificationStatus === "error" && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTimesCircle className="text-red-600 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Xác nhận thất bại</h2>
            <p className="text-gray-600 mb-6">
              Token xác nhận không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu gửi lại email xác nhận.
            </p>

            <form onSubmit={handleResendEmail} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email của bạn
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:border-[#27B5FC] transition-all duration-200"
                    placeholder="Nhập email của bạn"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isResending}
                className="w-full py-3 bg-gradient-to-r from-[#27B5FC] to-[#098be4] text-white rounded-xl hover:from-[#098be4] hover:to-[#27B5FC] focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isResending ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    Đang gửi...
                  </div>
                ) : (
                  "Gửi lại email xác nhận"
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link
                to="/"
                className="text-[#27B5FC] hover:text-[#098be4] font-medium hover:underline"
              >
                Quay lại trang chủ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
