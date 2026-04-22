import React, { useState } from "react";
import Button from "@/components/Button";
import { useSelector } from "react-redux";
import {
  useUpdateAnswerMutation,
} from "@/redux/api/qnaSlice";
import MyRichTextEditor from "@/components/student/qna/MyRTE";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function WriteAnswer({ quesId, courseId }) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState("");
  const { userInfo } = useSelector((state) => state.auth);
  const [updateAnswer , {isLoading}] =useUpdateAnswerMutation()

  const handleSubmit = async () => {
    if (content.trim() === "") return;
    try {
      await updateAnswer({ qnaId: quesId, body: { content }, courseId });
      setContent("");
      setIsFocused(false);
    } catch (error) {
      console.error("Lỗi khi tạo bình luận:", error);
    }    
  };

  return (
    <Dialog open={isFocused} onOpenChange={setIsFocused}>
      <DialogTrigger asChild>
        <div className="w-full flex items-center gap-2">
            <img
              src={userInfo?.profilePicture?.url || "/placeholder.svg"}
              alt="User's avatar"
              className="w-8 h-8 rounded-full border-1 border-[#098be4] rounded-full"
            />
          <input
            type="text"
            placeholder="Nhập nội dung câu trả lời của bạn"
            className="w-full py-2 rounded-md outline-1 outline-[#eef0f2] px-3"
          />
        </div>
      </DialogTrigger>
      <DialogContent className={"!max-w-[800px]"} aria-describedby={undefined}>
        <DialogTitle>
           Câu trả lời
        </DialogTitle>
        <div className="w-full overflow-x-auto min-w-0">
          <MyRichTextEditor
            value={content}
            onChange={setContent}
            className="w-full h-[200px] text-gray-200"
            placeholder="Nhập nội dung câu trả lời của bạn"
            mention={null}
          />
          <div className="flex space-x-2 justify-end mt-2">
            <Button
              onClick={() => setIsFocused(false)}
              disabled={isLoading}
              variant="outline"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              variant="reverse"
            >
              Trả lời
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default WriteAnswer;
