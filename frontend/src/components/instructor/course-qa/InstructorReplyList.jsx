import React, { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { MessageCircle } from "lucide-react";
import { useSelector } from "react-redux";
import Button from "@/components/Button";
import { useUpdateReactionReplyMutation } from "@/redux/api/qnaSlice";
import InstructorReactButton from "./InstructorReactButton";
import TopReaction from "@/components/student/qna/TopReaction";
import OptionOnReply from "@/components/student/qna/OptionOnReply";
import InstructorReply from "./InstructorReply";

const ReplyCard = ({ reply, courseId, quesId, commentId }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [updateReactionReply] = useUpdateReactionReplyMutation();

  const reaction = reply?.likes?.find((react) => react?.userId == userInfo._id)
    ? reply?.likes.find((react) => react?.userId == userInfo._id).type
    : null;

  const handleReaction = async (newReaction) => {
    try {
      const body = { type: newReaction };
      await updateReactionReply({
        qnaId: quesId,
        commentId: commentId,
        replyId: reply._id,
        body,
      });
    } catch (error) {
      console.log("Lỗi khi react phản hồi: ", error);
    }
  };

  function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);
    const intervals = [
      { label: "năm", seconds: 31536000 },
      { label: "tháng", seconds: 2592000 },
      { label: "ngày", seconds: 86400 },
      { label: "giờ", seconds: 3600 },
      { label: "phút", seconds: 60 },
    ];
    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label} trước`;
      }
    }
    return "vừa xong";
  }
  return (
    <div className="w-full rounded-lg p-2 space-y-2">
      <div className="w-full flex justify-between items-center gap-2">
        <div className="flex space-x-2 items-center">
          <img
            src={reply?.user.profilePicture.url || "/placeholder.svg"}
            className="w-10 h-10 rounded-full border-1 border-[#098be4]"
          />
          <p className="font-semibold">{reply?.user.firstName} {reply?.user.lastName}</p>
          <p className="text-sm text-gray-700">{timeAgo(reply?.createdAt)}</p>
        </div>
        {userInfo._id === reply?.user._id && <OptionOnReply replyInfo={{reply, quesId, commentId}}/>}
      </div>
      <div
        className="prose max-w-none tiptap"
        dangerouslySetInnerHTML={{ __html: reply?.content }}
      />
      <div className="w-full flex justify-between items-center gap-2">
        <div className="flex space-x-2 items-center">
          <InstructorReactButton reaction={reaction} handler={handleReaction} />
          <InstructorReply quesId={quesId}
            commentId={commentId}
            target={reply.user}
            courseId={courseId}/>
        </div>
        {/*Số lượng reaction & top 3*/}
        <TopReaction likes={reply.likes} />
      </div>
    </div>
  );
};

function InstructorReplyList({ quesId, commentId, courseId, replies }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger>
        <p className="font-semibold text-sm hover:underline hover:text-[#098be4]">
          {isOpen
            ? "Ẩn phản hồi"
            : replies.length > 1
            ? `Xem tất cả ${replies.length} phản hổi`
            : "Xem 1 phản hồi"}
        </p>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {replies.map((reply) => {
          return (
            <ReplyCard
              key={reply._id}
              reply={reply}
              quesId={quesId}
              commentId={commentId}
              courseId={courseId}
            />
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default InstructorReplyList;
