import React, { useState } from "react";
import MyRichTextEditor from "./MyRTE";
import Button from "@/components/Button";
import { useSelector } from "react-redux";
import { useCreateReplyMutation } from "@/redux/api/qnaSlice";

function WriteReply({ quesId, commentId , target, onCancel }) {
  const [content, setContent] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const [createReply, {isLoading}] = useCreateReplyMutation();

  const handleSubmit = async() => {
    if (content.trim() === "") return;
    try {
      await createReply({ qnaId: quesId, commentId, body: { content } });
    } catch (error) {
      console.error("Lỗi khi tạo phản hồi:", error);
    }
    setContent("");
    onCancel()
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
        
          <div className="w-full">
            <MyRichTextEditor
              value={content}
              onChange={setContent}
              className="w-full h-[200px] text-gray-200"
              placeholder="Nhập nội dung phản hồi của bạn"
              mention={target}
            />
            <div className="flex space-x-2 justify-end mt-2">
              <Button onClick={onCancel} disabled={isLoading} variant="outline">
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading} variant="reverse">
                Phản hồi
              </Button>
            </div>
          </div>
  
      </div>
    </div>
  );
}

export default WriteReply;
