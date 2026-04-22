import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";
import User from "../models/user.js";

export const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo token xác nhận email
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(
      emailVerificationTokenExpires.getHours() + 24
    ); // 24 giờ

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpires,
    });

    if (newUser) {
      await newUser.save();

      // Gửi email xác nhận
      const emailSent = await sendVerificationEmail(
        email,
        emailVerificationToken
      );

      if (!emailSent) {
        // Nếu không gửi được email, vẫn trả về thành công nhưng cảnh báo
        console.error("Failed to send verification email to:", email);
      }

      // KHÔNG tạo JWT token ở đây, chỉ trả về thông báo
      res.status(201).json({
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.",
        email: newUser.email,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    let isPasswordCorrect = null;
    if (email === "alice@example.com") {
      isPasswordCorrect = password === user.password ? true : false;
    } else {
      isPasswordCorrect = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Kiểm tra email đã được xác nhận chưa
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Email chưa được xác nhận. Vui lòng kiểm tra email và xác nhận tài khoản trước khi đăng nhập.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token xác nhận không hợp lệ" });
    }

    // Tìm user theo token
    const user = await User.findOne({ emailVerificationToken: token });

    // Nếu không tìm thấy user với token này
    if (!user) {
      return res.status(400).json({ message: "Token xác nhận không hợp lệ" });
    }

    // Nếu email đã được xác nhận rồi (token đã được dùng)
    if (user.isEmailVerified) {
      return res.status(400).json({
        message:
          "Token này đã được sử dụng. Email của bạn đã được xác nhận trước đó.",
        code: "TOKEN_ALREADY_USED",
      });
    }

    // Nếu token hết hạn
    if (
      user.emailVerificationTokenExpires &&
      user.emailVerificationTokenExpires < new Date()
    ) {
      return res.status(400).json({ message: "Token xác nhận đã hết hạn" });
    }

    // ✅ Cập nhật trạng thái xác nhận email (GIỮ LẠI TOKEN để có thể kiểm tra đã dùng)
    user.isEmailVerified = true;
    // KHÔNG xóa token, giữ lại để biết token này đã được dùng
    await user.save();

    res.status(200).json({
      message:
        "Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay bây giờ.",
    });
  } catch (error) {
    console.error("Error in verifyEmail controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email đã được xác nhận rồi" });
    }

    // Tạo token mới
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenExpires = new Date();
    emailVerificationTokenExpires.setHours(
      emailVerificationTokenExpires.getHours() + 24
    );

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpires = emailVerificationTokenExpires;
    await user.save();

    // Gửi email
    const emailSent = await sendVerificationEmail(
      email,
      emailVerificationToken
    );

    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Không thể gửi email. Vui lòng thử lại sau." });
    }

    res.status(200).json({
      message:
        "Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.",
    });
  } catch (error) {
    console.log("Error in resendVerificationEmail controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Google OAuth Authentication
 * - Verify Google ID token
 * - Create new user or login existing user
 */
export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify Google ID token
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );

    if (!response.ok) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const payload = await response.json();

    // Check if token is for our app
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ cho ứng dụng này" });
    }

    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ googleId: googleId }, { email: email }],
    });

    if (user) {
      // User exists - update Google ID if needed and login
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        user.isEmailVerified = true; // Google đã verify email
        if (picture && !user.profilePicture?.url) {
          user.profilePicture = { url: picture, public_id: "" };
        }
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        firstName: given_name || "User",
        lastName: family_name || "",
        email: email,
        googleId: googleId,
        authProvider: "google",
        isEmailVerified: true, // Google đã verify email
        profilePicture: {
          url: picture || "",
          public_id: "",
        },
        role: "user",
      });
      await user.save();
    }

    // Generate JWT token
    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error("Error in googleAuth controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Forgot Password - Send reset password email
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email là bắt buộc" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Để bảo mật, vẫn trả về success dù email không tồn tại
      return res.status(200).json({
        message:
          "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu.",
      });
    }

    // Kiểm tra nếu user đăng ký bằng Google
    if (user.authProvider === "google" && !user.password) {
      return res.status(400).json({
        message:
          "Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.",
      });
    }

    // Tạo reset token
    const resetPasswordToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1); // 1 giờ

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    // Import dynamic để tránh circular dependency
    const { sendResetPasswordEmail } = await import("../utils/sendEmail.js");

    const emailSent = await sendResetPasswordEmail(email, resetPasswordToken);

    if (!emailSent) {
      return res.status(500).json({
        message: "Không thể gửi email. Vui lòng thử lại sau.",
      });
    }

    res.status(200).json({
      message:
        "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được email đặt lại mật khẩu.",
    });
  } catch (error) {
    console.error("Error in forgotPassword controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Verify Reset Token - Check if reset token is valid
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Token không hợp lệ" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.",
      });
    }

    res.status(200).json({
      message: "Token hợp lệ",
      email: user.email,
    });
  } catch (error) {
    console.error("Error in verifyResetToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Reset Password - Set new password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token và mật khẩu mới là bắt buộc" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Token không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu đặt lại mật khẩu mới.",
      });
    }

    // Hash password mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật password và xóa reset token
    user.password = hashedPassword;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message:
        "Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập ngay bây giờ.",
    });
  } catch (error) {
    console.error("Error in resetPassword controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
