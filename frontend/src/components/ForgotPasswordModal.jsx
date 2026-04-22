import { useState, useEffect } from "react";
import { FaEnvelope, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { useForgotPasswordMutation } from "../redux/api/authSlice";
import Modal from "./Modal";

const ForgotPasswordModal = ({ isOpen, onClose, onBackToSignIn }) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1); // 1: nhập email, 2: đã gửi email
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setStep(1);
      setError("");
    }
  }, [isOpen]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email của bạn");
      return;
    }

    if (!validateEmail(email)) {
      setError("Email không hợp lệ");
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      setStep(2);
    } catch (err) {
      const errorMessage =
        err?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại sau.";
      toast.error(errorMessage, { position: "bottom-right" });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quên mật khẩu" size="md">
      <div className="space-y-6">
        {step === 1 && (
          <>
            {/* Icon và tiêu đề */}
            <div className="text-center">
              <div className="w-16 h-16 bg-[#0C8DE9] rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEnvelope className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Đặt lại mật khẩu
              </h3>
              <p className="text-gray-600">
                Nhập email đăng ký để nhận link đặt lại mật khẩu
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email field */}
              <div className="space-y-2">
                <label
                  htmlFor="forgot-email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="forgot-email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                      error
                        ? "border-blue-500 focus:ring-blue-500 focus:border-blue-500"
                        : "border-gray-300 focus:ring-[#0C8DE9] focus:border-[#0C8DE9]"
                    }`}
                    placeholder="Nhập email của bạn"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {error}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#0C8DE9] text-white rounded-xl  focus:outline-none focus:ring-2 focus:ring-[#0C8DE9] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </div>
                ) : (
                  "Gửi email đặt lại"
                )}
              </button>
            </form>

            {/* Back to sign in */}
            <div className="text-center">
              <button
                onClick={onBackToSignIn}
                className="inline-flex items-center text-[#27B5FC] hover:text-[#098be4] font-medium transition-colors"
              >
                <FaArrowLeft className="mr-2" />
                Quay lại đăng nhập
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Success message */}
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaCheckCircle className="text-green-500 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                Email đã được gửi!
              </h3>
              <p className="text-gray-600 mb-2">
                Kiểm tra email <strong>{email}</strong> để nhận email hướng dẫn
                đặt lại mật khẩu.
              </p>
              <p className="text-sm text-gray-500">
                Vui lòng kiểm tra hộp thư đến và thư rác của bạn.
              </p>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Link đặt lại mật khẩu có hiệu lực
                trong 1 giờ. Nếu không nhận được email, hãy thử lại hoặc liên hệ
                hỗ trợ.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={onBackToSignIn}
                className="w-full py-3 bg-gradient-to-r from-[#27B5FC] to-[#098be4] text-white rounded-xl hover:from-[#098be4] hover:to-[#27B5FC] focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg"
              >
                Quay lại đăng nhập
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-all duration-200 font-medium"
              >
                Gửi lại email
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ForgotPasswordModal;
