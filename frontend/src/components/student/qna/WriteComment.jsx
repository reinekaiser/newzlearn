import React, { useState } from "react";
import MyRichTextEditor from "./MyRTE";
import Button from "@/components/Button";
import { useSelector } from "react-redux";
import { useCreateCommentMutation } from "@/redux/api/qnaSlice";

function WriteComment({ quesId }) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const [createComment, {isLoading}] = useCreateCommentMutation();

  const handleSubmit = async() => {
    if (content.trim() === "") return;
    try {
      await createComment({ qnaId: quesId, body: { content } });
    } catch (error) {
      console.error("Lỗi khi tạo bình luận:", error);
    }
    setContent("");
    setIsFocused(false);
  };

  return (
    <div className="flex items-start gap-2 rounded-lg my-4">
      {/* Ảnh đại diện người dùng */}
      <img
        src={userInfo?.profilePicture?.url || "/placeholder.svg"}
        alt="User's avatar"
        className="w-8 h-8 rounded-full border-1 border-[#098be4] rounded-full"
      />

      <div className="w-full flex items-center">
        {/* Khi chưa focus → input đơn */}
        {!isFocused ? (
          <input
            type="text"
            placeholder="Nhập bình luận mới của bạn"
            onFocus={() => setIsFocused(true)}
            className="w-full py-2 rounded-md outline-1 outline-[#eef0f2] px-3"
          />
        ) : (
          <div className="w-full">
            <MyRichTextEditor
              value={content}
              onChange={setContent}
              className="w-full h-[200px] text-gray-200"
              placeholder="Nhập nội dung bình luận của bạn"
              mention={null}
            />
            <div className="flex space-x-2 justify-end mt-2">
              <Button onClick={() => setIsFocused(false)} disabled={isLoading} variant="outline">
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} variant="reverse">
                Bình luận
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WriteComment;
