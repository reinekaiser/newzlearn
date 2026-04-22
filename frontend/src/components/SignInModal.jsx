import { useEffect, useState } from "react";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/features/authSlice";
import {
  useLoginMutation,
  useResendVerificationEmailMutation,
  useGoogleAuthMutation,
} from "../redux/api/authSlice";
import { GoogleLogin } from "@react-oauth/google";

import Modal from "./Modal";
import ForgotPasswordModal from "./ForgotPasswordModal";

const SignInModal = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { isLoading }] = useLoginMutation();
  const [resendVerificationEmail, { isLoading: isResending }] =
    useResendVerificationEmailMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();
  const [errors, setErrors] = useState({});
  const [showResendEmail, setShowResendEmail] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setErrors({});
      setShowResendEmail(false);
      setShowPassword(false);
      setShowForgotPassword(false);
    }
  }, [isOpen]);

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail({ email }).unwrap();
      toast.success(
        "Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
        {
          position: "bottom-right",
        }
      );
      setShowResendEmail(false);
    } catch (resendError) {
      toast.error(
        resendError?.data?.message ||
          "Không thể gửi email. Vui lòng thử lại sau.",
        { position: "bottom-right" }
      );
    }
  };

  // Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const user = await googleAuth({
        credential: credentialResponse.credential,
      }).unwrap();
      dispatch(setCredentials(user));
      toast.success("Đăng nhập bằng Google thành công!", {
        position: "bottom-right",
      });
      onClose();
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error(error?.data?.message || "Đăng nhập bằng Google thất bại", {
        position: "bottom-right",
      });
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng nhập bằng Google thất bại. Vui lòng thử lại.", {
      position: "bottom-right",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = "📧 Vui lòng nhập email của bạn";
    }
    if (!password.trim()) {
      newErrors.password = "🔒 Vui lòng nhập mật khẩu";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const user = await login({ email, password }).unwrap();
      dispatch(setCredentials(user));
      toast.success("Đăng nhập thành công! Chào mừng bạn trở lại!", {
        position: "bottom-right",
      });
      onClose();
    } catch (error) {
      console.error("Login error:", error);
      const status = error?.status;
      const errorMessage = error?.data?.message;
      const errorCode = error?.data?.code;

      switch (status) {
        case 403:
          if (errorCode === "EMAIL_NOT_VERIFIED") {
            setShowResendEmail(true);
            toast.error(errorMessage, {
              position: "bottom-right",
              autoClose: 5000,
            });
          } else {
            toast.error(errorMessage || "Bạn không có quyền truy cập", {
              position: "bottom-right",
            });
          }
          break;
        case 400:
        case 401:
          toast.error(
            "Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại!",
            { position: "bottom-right" }
          );
          break;
        case 500:
          toast.error("Lỗi máy chủ. Vui lòng thử lại sau", {
            position: "bottom-right",
          });
          break;
        default:
          toast.error(errorMessage || "Đăng nhập thất bại", {
            position: "bottom-right",
          });
      }
    }
  };

  const handleOpenForgotPassword = () => {
    setShowForgotPassword(true);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPassword(false);
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !showForgotPassword}
        onClose={onClose}
        title="Đăng nhập"
        size="md"
      >
        <div className="space-y-6">
          {/* Welcome message */}
          <div className="text-center">
            <div className="w-16 h-16 bg-linear-to-r from-[#27B5FC] to-[#098be4] rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUser className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Chào mừng trở lại!
            </h3>
            <p className="text-gray-600">Đăng nhập để tiếp tục học tập</p>
          </div>

          {/* Switch to sign up */}
          <div className="text-center">
            <p className="text-gray-600">
              Chưa có tài khoản?{" "}
              <button
                onClick={onSwitchToSignUp}
                className="text-[#27B5FC] hover:text-[#098be4] font-semibold hover:underline transition-colors"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
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
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-[#27B5FC] focus:border-[#27B5FC]"
                  }`}
                  placeholder="Nhập email của bạn"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: "" });
                    }
                  }}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-[#27B5FC] focus:border-[#27B5FC]"
                  }`}
                  placeholder="Nhập mật khẩu của bạn"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <FaEyeSlash className="h-5 w-5" />
                  ) : (
                    <FaEye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <button
                type="button"
                onClick={handleOpenForgotPassword}
                className="text-sm text-[#27B5FC] hover:text-[#098be4] hover:underline font-medium transition-colors"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Resend verification email */}
            {showResendEmail && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800 mb-3">
                  Email của bạn chưa được xác nhận. Vui lòng kiểm tra email và
                  xác nhận tài khoản trước khi đăng nhập.
                </p>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  {isResending ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang gửi...
                    </div>
                  ) : (
                    "Gửi lại email xác nhận"
                  )}
                </button>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-linear-to-r from-[#27B5FC] to-[#098be4] text-white rounded-xl hover:from-[#098be4] hover:to-[#27B5FC] focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          {/* Social login options */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                theme="outline"
                size="large"
                text="continue_with"
                shape="rectangular"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isOpen && showForgotPassword}
        onClose={onClose}
        onBackToSignIn={handleBackToSignIn}
      />
    </>
  );
};

export default SignInModal;
