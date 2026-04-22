import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaLock,
  FaEnvelope,
  FaUserPlus,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/features/authSlice";
import {
  useSignupMutation,
  useGoogleAuthMutation,
} from "../redux/api/authSlice";
import { GoogleLogin } from "@react-oauth/google";

import Modal from "./Modal";

const SignUpModal = ({ isOpen, onClose, onSwitchToSignIn }) => {
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [signup, { isLoading }] = useSignupMutation();
  const [googleAuth, { isLoading: isGoogleLoading }] = useGoogleAuthMutation();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
      });
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const user = await googleAuth({
        credential: credentialResponse.credential,
      }).unwrap();
      dispatch(setCredentials(user));
      toast.success("Đăng ký bằng Google thành công!", {
        position: "bottom-right",
      });
      onClose();
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error(error?.data?.message || "Đăng ký bằng Google thất bại", {
        position: "bottom-right",
      });
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng ký bằng Google thất bại. Vui lòng thử lại.", {
      position: "bottom-right",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password.trim();
    const confirmPassword = formData.confirmPassword.trim();

    // ===== Required =====
    if (!firstName) {
      toast.error("Vui lòng nhập tên", { position: "bottom-right" });
      return;
    }

    if (!lastName) {
      toast.error("Vui lòng nhập họ", { position: "bottom-right" });
      return;
    }

    if (!email) {
      toast.error("Vui lòng nhập email", { position: "bottom-right" });
      return;
    }

    if (!password) {
      toast.error("Vui lòng nhập mật khẩu", { position: "bottom-right" });
      return;
    }

    if (!confirmPassword) {
      toast.error("Vui lòng xác nhận mật khẩu", { position: "bottom-right" });
      return;
    }

    // ===== Name validation =====
    const nameRegex = /^[A-Za-zÀ-ỹ\s]+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      toast.error("Họ và tên chỉ được chứa chữ cái", {
        position: "bottom-right",
      });
      return;
    }

    if (firstName.length > 50 || lastName.length > 50) {
      toast.error("Họ và tên không được vượt quá 50 ký tự", {
        position: "bottom-right",
      });
      return;
    }

    // ===== Email validation =====
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email không hợp lệ", { position: "bottom-right" });
      return;
    }

    // ===== Password rules =====
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự", {
        position: "bottom-right",
      });
      return;
    }

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/;
    if (!passwordStrengthRegex.test(password)) {
      toast.error("Mật khẩu phải gồm chữ hoa, thường, số và ký tự đặc biệt", {
        position: "bottom-right",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp", { position: "bottom-right" });
      return;
    }

    // ===== Submit =====
    try {
      const payload = {
        firstName,
        lastName,
        email,
        password,
        role: "user",
      };

      const response = await signup(payload).unwrap();

      toast.success(
        response?.message ||
        "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
        { position: "bottom-right", autoClose: 5000 }
      );

      onClose();
      onSwitchToSignIn();
    } catch (error) {
      const status = error?.status;
      const message = error?.data?.message;

      switch (status) {
        case 400:
          toast.error(message || "Thông tin đăng ký không hợp lệ", {
            position: "bottom-right",
          });
          break;
        case 409:
          toast.error("Email đã tồn tại. Bạn có muốn đăng nhập không?", {
            position: "bottom-right",
          });
          break;
        case 500:
          toast.error("Lỗi máy chủ. Vui lòng thử lại sau", {
            position: "bottom-right",
          });
          break;
        default:
          toast.error(message || "Đăng ký thất bại", {
            position: "bottom-right",
          });
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đăng ký" size="lg">
      <div className="space-y-6">
        {/* Welcome message */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Tạo tài khoản mới
          </h3>
          <p className="text-gray-600">
            Tham gia cùng hàng nghìn học viên khác
          </p>
        </div>

        {/* Switch to sign in */}
        <div className="text-center">
          <p className="text-gray-600">
            Đã có tài khoản?{" "}
            <button
              onClick={onSwitchToSignIn}
              className="text-[#27B5FC] hover:text-[#098be4] font-semibold hover:underline transition-colors"
            >
              Đăng nhập
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                Tên
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:border-[#27B5FC] transition-all duration-200"
                  placeholder="Nhập tên"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Họ
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:border-[#27B5FC] transition-all duration-200"
                  placeholder="Nhập họ"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:border-[#27B5FC] transition-all duration-200"
                placeholder="Nhập email của bạn"
                required
              />
            </div>
          </div>

          {/* Password fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:border-[#27B5FC] transition-all duration-200"
                  placeholder="Tạo mật khẩu"
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
            </div>
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:border-[#27B5FC] transition-all duration-200"
                  placeholder="Xác nhận mật khẩu"
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
            </div>
          </div>

          {/* Terms and conditions */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                className="h-4 w-4 accent-[#27B5FC] rounded"
                required
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className="text-gray-700">
                Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật
              </label>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-linear-to-r from-[#27B5FC] to-[#098be4] text-white rounded-xl hover:from-[#098be4] hover:to-[#27B5FC] focus:outline-none focus:ring-2 focus:ring-[#27B5FC] focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Đang tạo tài khoản...
              </div>
            ) : (
              "Tạo tài khoản"
            )}
          </button>
        </form>

        {/* Social signup options */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Hoặc đăng ký với
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
              text="signup_with"
              shape="rectangular"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SignUpModal;
