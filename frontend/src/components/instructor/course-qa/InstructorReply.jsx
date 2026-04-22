import React, { useState } from "react";
import Button from "@/components/Button";
import { useSelector } from "react-redux";
import { useCreateInstructorReplyMutation, } from "@/redux/api/qnaSlice";
import MyRichTextEditor from "@/components/student/qna/MyRTE";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle } from "lucide-react";

function InstructorReply({ quesId, commentId, courseId, target }) {
  const [isFocused, setIsFocused] = useState(false);
  const [content, setContent] = useState("");
  const [createReply, {isLoading}] = useCreateInstructorReplyMutation()

  const handleSubmit = async () => {
    if (content.trim() === "") return;
    try {
        await createReply({ qnaId: quesId, commentId, body: { content }, courseId });
      setContent("");
      setIsFocused(false);
    } catch (error) {
      console.error("Lỗi khi tạo phản hồi:", error);
    }    
  };

  return (
    <Dialog open={isFocused} onOpenChange={setIsFocused}>
      <DialogTrigger asChild>
        <Button
            variant="default"
            className="flex gap-2 items-center text-gray-500"
          >
            <MessageCircle style={{ width: "20px", height: "20px" }} />
            Phản hồi
          </Button>
      </DialogTrigger>
      <DialogContent className={"!max-w-[800px]"} aria-describedby={undefined}>
        <DialogTitle>
           Phản hồi bình luận
        </DialogTitle>
        <div className="w-full overflow-x-auto min-w-0">
          <MyRichTextEditor
            value={content}
            onChange={setContent}
            className="w-full h-[200px] text-gray-200"
            placeholder="Nhập nội dung phản hồi của bạn"
            mention={target}
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
              Phản hồi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InstructorReply;
