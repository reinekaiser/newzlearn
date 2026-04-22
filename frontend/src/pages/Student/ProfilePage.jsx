"use client";

import { useState, useRef, useEffect } from "react";
import { User } from "lucide-react";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "../../redux/api/profileApiSlice";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("profile");

  // Redux hooks
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    refetch,
  } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdatingProfile }] =
    useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] =
    useChangePasswordMutation();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profilePicture: {
      url: "",
      public_id: "",
    },
    major: "",
    biography: "",
  });

  // Preview ảnh mới (chưa upload)
  const [newProfilePicturePreview, setNewProfilePicturePreview] =
    useState(null);

  // Form đổi mật khẩu
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Thông báo từng tab
  const [profileMessage, setProfileMessage] = useState(null);
  const [securityMessage, setSecurityMessage] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState(null);

  const fileInputRef = useRef(null);

  // Load profile data khi component mount hoặc khi data thay đổi
  useEffect(() => {
    if (profileData) {
      const userData = profileData;
      setProfile({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        profilePicture: userData.profilePicture || { url: "", public_id: "" },
        major: userData.major || "",
        biography: userData.biography || "",
      });
      // Reset preview khi load data mới
      setNewProfilePicturePreview(null);
    }
  }, [profileData]);

  useEffect(() => {
  console.log("profileData:", profileData);
}, [profileData]);

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Preview ảnh (chưa upload, chỉ hiển thị)
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setProfileMessage({
        type: "error",
        text: "Vui lòng chọn file ảnh hợp lệ",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileMessage({
        type: "error",
        text: "Kích thước ảnh không được vượt quá 5MB",
      });
      return;
    }

    // Convert to base64 để preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      setNewProfilePicturePreview(base64Image);
      setProfileMessage(null); // Clear error message nếu có
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage(null);

    try {
      // Chuẩn bị data để gửi
      const updateData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        major: profile.major,
        biography: profile.biography,
      };

      // Nếu có ảnh preview mới, thêm vào data
      if (newProfilePicturePreview) {
        updateData.profilePicture = newProfilePicturePreview;
      }

      const result = await updateProfile(updateData).unwrap();

      if (result.success) {
        setProfileMessage({
          type: "success",
          text: "Cập nhật hồ sơ thành công!",
        });
        // Reset preview sau khi upload thành công
        setNewProfilePicturePreview(null);
        refetch();
      }
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: error?.data?.message || "Lỗi khi cập nhật hồ sơ",
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSecurityMessage(null);

    // Validate
    if (
      !passwordData.oldPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setSecurityMessage({
        type: "error",
        text: "Vui lòng điền đầy đủ thông tin",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSecurityMessage({
        type: "error",
        text: "Mật khẩu mới và xác nhận mật khẩu không khớp",
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setSecurityMessage({
        type: "error",
        text: "Mật khẩu mới phải có ít nhất 6 ký tự",
      });
      return;
    }

    try {
      const result = await changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();

      if (result.success) {
        setSecurityMessage({
          type: "success",
          text: "Đổi mật khẩu thành công!",
        });
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      setSecurityMessage({
        type: "error",
        text: error?.data?.message || "Lỗi khi đổi mật khẩu",
      });
    }
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản này vĩnh viễn? Hành động này không thể hoàn tác."
    );
    if (!confirmDelete) return;
    setDeleteMessage({
      type: "success",
      text: "Tài khoản đã được xóa thành công.",
    });
  };

  // Loading state
  if (isLoadingProfile) {
    return (
      <div className="py-10 container mx-auto bg-white flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#098be4] mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  // --- JSX ---
  return (
    <>
      <Header />
      <div className="py-10 container mx-auto bg-white">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-58 border border-gray-200 bg-white">
            <div className="py-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center text-black text-4xl font-bold mb-4 overflow-hidden">
                  {profile.profilePicture?.url ? (
                    <img
                      src={profile.profilePicture.url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : profile.firstName ? (
                    profile.firstName[0].toUpperCase()
                  ) : (
                    "W"
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {profile.firstName || "User"}
                </h2>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-4 py-2 text-sm rounded transition-colors cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#f0f4ff] text-[#098be4] font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Hồ sơ
                </button>

                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full text-left px-4 py-2 text-sm rounded transition-colors cursor-pointer ${
                    activeTab === "security"
                      ? "bg-[#f0f4ff] text-[#098be4] font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Bảo mật tài khoản
                </button>

                <button
                  onClick={() => setActiveTab("delete")}
                  className={`w-full text-left px-4 py-2 text-sm rounded transition-colors cursor-pointer ${
                    activeTab === "delete"
                      ? "bg-[#f0f4ff] text-[#098be4] font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Xóa tài khoản
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="border-y border-r border-gray-200 min-h-screen">
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <div>
                  <div className="border-b border-gray-200 py-6 text-center">
                    <h1 className="text-3xl font-semibold text-gray-900">
                      Hồ sơ cá nhân
                    </h1>
                    <p className="text-gray-600">
                      Thêm thông tin về bản thân bạn
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-8 px-14 py-6"
                  >
                    {/* Profile Picture */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Ảnh đại diện
                      </h3>
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
                            {newProfilePicturePreview ? (
                              <img
                                src={newProfilePicturePreview}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                              />
                            ) : profile.profilePicture?.url ? (
                              <img
                                src={profile.profilePicture.url}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </div>

                        <div className="flex-1">
                          <h4 className="text-base font-medium text-gray-900 mb-2">
                            Tải lên ảnh mới
                          </h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Chọn một bức ảnh rõ nét của bạn. Kích thước đề xuất:
                            400x400px hoặc lớn hơn. Tối đa 5MB.
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUpdatingProfile}
                            className="px-4 py-2 bg-[#098be4] hover:bg-[#007bbd] text-white font-medium rounded-lg cursor-pointer disabled:opacity-50"
                          >
                            {isUpdatingProfile ? "Đang tải..." : "Chọn ảnh"}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Thông tin cơ bản
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="lastName"
                            value={profile.lastName}
                            onChange={handleInputChange}
                            placeholder="Họ"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="firstName"
                            value={profile.firstName}
                            onChange={handleInputChange}
                            placeholder="Tên"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <input
                          type="text"
                          name="major"
                          value={profile.major}
                          onChange={handleInputChange}
                          placeholder="Chuyên ngành"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Biography */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Tiểu sử
                      </h3>
                      <textarea
                        name="biography"
                        value={profile.biography}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Tiểu sử của bạn..."
                        className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Profile Message */}
                    {profileMessage && (
                      <div
                        className={`p-4 rounded-lg ${
                          profileMessage.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                        }`}
                      >
                        {profileMessage.text}
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMessage(null);
                          // Reset preview ảnh
                          setNewProfilePicturePreview(null);
                          // Reset về thông tin ban đầu
                          if (profileData?.data) {
                            const userData = profileData.data;
                            setProfile({
                              firstName: userData.firstName || "",
                              lastName: userData.lastName || "",
                              email: userData.email || "",
                              profilePicture: userData.profilePicture || {
                                url: "",
                                public_id: "",
                              },
                              major: userData.major || "",
                              biography: userData.biography || "",
                            });
                          }
                        }}
                        className="px-6 py-3 bg-white text-gray-900 border border-gray-300 font-medium rounded-lg disabled:opacity-50 cursor-pointer hover:bg-gray-50"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingProfile}
                        className="px-6 py-3 bg-[#098be4] hover:bg-[#007bbd] text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                      >
                        {isUpdatingProfile ? "Đang lưu..." : "Lưu"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div>
                  <div className="border-b border-gray-200 py-6 text-center">
                    <h1 className="text-3xl font-semibold text-gray-900">
                      Bảo mật
                    </h1>
                    <p className="text-gray-600">Thay đổi mật khẩu tại đây.</p>
                  </div>

                  <form
                    onSubmit={handlePasswordChange}
                    className="space-y-8 px-14 py-6"
                  >
                    <div>
                      <label className="block font-semibold text-gray-900 mb-3">
                        Email:
                      </label>
                      <div className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-gray-50">
                        Địa chỉ email hiện tại:{" "}
                        <span className="font-medium text-gray-900">
                          {profile.email || "Chưa có email"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-900 mb-3">
                        Mật khẩu cũ
                      </label>
                      <input
                        type="password"
                        name="oldPassword"
                        value={passwordData.oldPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Nhập mật khẩu cũ"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-900 mb-3">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Nhập mật khẩu mới"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-900 mb-3">
                        Xác nhận mật khẩu
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordInputChange}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Security Message */}
                    {securityMessage && (
                      <div
                        className={`p-4 rounded-lg ${
                          securityMessage.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                        }`}
                      >
                        {securityMessage.text}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="px-6 py-3 bg-[#098be4] hover:bg-[#007bbd] text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      {isChangingPassword ? "Đang lưu..." : "Thay đổi mật khẩu"}
                    </button>
                  </form>
                </div>
              )}

              {/* DELETE TAB */}
              {activeTab === "delete" && (
                <div>
                  <div className="border-b border-gray-200 py-6 text-center">
                    <h1 className="text-3xl font-semibold text-gray-900">
                      Xóa tài khoản
                    </h1>
                    <p className="text-gray-600">
                      Hành động này sẽ xóa toàn bộ dữ liệu tài khoản của bạn
                      vĩnh viễn. Không thể hoàn tác.
                    </p>
                  </div>

                  <div className="px-14 py-6">
                    <p className="mb-6 text-red-700 font-medium">
                      Cảnh báo: Sau khi bạn xóa tài khoản, tất cả dữ liệu sẽ bị
                      mất vĩnh viễn.
                    </p>

                    {deleteMessage && (
                      <div
                        className={`p-4 rounded-lg mb-4 ${
                          deleteMessage.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-700"
                            : "bg-red-50 border border-red-200 text-red-700"
                        }`}
                      >
                        {deleteMessage.text}
                      </div>
                    )}

                    <button
                      onClick={handleDeleteAccount}
                      disabled={isLoadingProfile}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50 cursor-pointer"
                    >
                      Xóa tài khoản
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
