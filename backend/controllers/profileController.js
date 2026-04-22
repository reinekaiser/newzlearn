import bcrypt from "bcryptjs";
import User from "../models/user.js";
import cloudinary from "../config/cloudinary.js";

// Lấy thông tin profile
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Người dùng không tồn tại" 
            });
        }
        res.status(200).json({
            success: true,
            message: "Lấy thông tin profile thành công",
            data: user
        });
    } catch (error) {
        console.log("Error in getProfile controller:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Lỗi server" 
        });
    }
};

// Cập nhật profile (bao gồm ảnh đại diện)
export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, major, biography, profilePicture } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Người dùng không tồn tại" 
            });
        }

        // Cập nhật thông tin cơ bản
        if (firstName !== undefined) user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (major !== undefined) user.major = major;
        if (biography !== undefined) user.biography = biography;

        // Xử lý upload ảnh nếu có (nhận base64 từ frontend)
        if (profilePicture && typeof profilePicture === 'string' && profilePicture.startsWith('data:image')) {
            try {
                // Xóa ảnh cũ trên Cloudinary nếu có
                if (user.profilePicture.public_id) {
                    await cloudinary.uploader.destroy(user.profilePicture.public_id);
                }

                // Upload ảnh mới lên Cloudinary từ base64
                const result = await cloudinary.uploader.upload(profilePicture, {
                    folder: "profile-pictures",
                    width: 400,
                    height: 400,
                    crop: "fill",
                    quality: "auto",
                });

                user.profilePicture = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            } catch (uploadError) {
                console.log("Error uploading to Cloudinary:", uploadError.message);
                return res.status(500).json({ 
                    success: false,
                    message: "Lỗi khi upload ảnh lên Cloudinary" 
                });
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Cập nhật profile thành công",
            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                major: user.major,
                biography: user.biography,
                profilePicture: user.profilePicture,
                role: user.role
            }
        });
    } catch (error) {
        console.log("Error in updateProfile controller:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Lỗi server" 
        });
    }
};

// Đổi mật khẩu (yêu cầu mật khẩu cũ)
export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ 
                success: false,
                message: "Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới" 
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: "Mật khẩu mới phải có ít nhất 6 ký tự" 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Người dùng không tồn tại" 
            });
        }

        // Xác nhận mật khẩu cũ
        const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ 
                success: false,
                message: "Mật khẩu cũ không đúng" 
            });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Đổi mật khẩu thành công"
        });
    } catch (error) {
        console.log("Error in changePassword controller:", error.message);
        res.status(500).json({ 
            success: false,
            message: "Lỗi server" 
        });
    }
};

