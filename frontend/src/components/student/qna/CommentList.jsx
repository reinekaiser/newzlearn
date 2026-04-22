import { ArrowBigUp, CircleCheck, MessageCircle } from "lucide-react";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import ReactButton from "./ReactButton";
import Button from "@/components/Button";
import TopReaction from "./TopReaction";
import WriteReply from "./WriteReply";
import ReplyList from "./ReplyList";
import { useUpdateReactionCommentMutation } from "@/redux/api/qnaSlice";
import OptionOnComment from "./OptionOnComment";

const CommentCard = ({ ques, comment }) => {
  const { userInfo } = useSelector((state) => state.auth);
  const [updateReactionComment] = useUpdateReactionCommentMutation();

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

  const reaction = comment?.likes.find((react) => react?.userId == userInfo._id)
    ? comment?.likes.find((react) => react?.userId == userInfo._id).type
    : null; //reaction hiện tại của người dùng

  const handleReaction = async (newReaction) => {
    try {
      const body = { type: newReaction };
      await updateReactionComment({
        qnaId: ques._id,
        commentId: comment._id,
        body,
      });
    } catch (error) {
      console.log("Lỗi khi react bình luận: ", error);
    }
  };

  const [replyBox, setReplyBox] = useState(false);
  const [replyTarget, setTarget] = useState(null);

  return (
    <div className="w-full rounded-lg p-2 space-y-2">
      <div className="w-full flex justify-between items-center gap-2">
        <div className="flex space-x-2 items-center">
          <img
            src={comment?.user.profilePicture.url || "/placeholder.svg"}
            className="w-10 h-10 rounded-full border-1 border-[#098be4]"
          />
          <p className="font-semibold">{comment?.user.firstName} {comment?.user.lastName}</p>
          <p className="text-sm text-gray-700">{timeAgo(comment?.createdAt)}</p>
        </div>
        <div className="flex space-x-2 items-center">
          {comment?.isSolution ? (
            <div className="flex items-center text-green-500 gap-2 text-sm">
              <CircleCheck />
              Câu trả lời
            </div>
          ) : comment?.isTopComment ? (
            <div>
              <div className="flex items-center text-green-500 gap-2 text-sm">
                <ArrowBigUp />
                Bình luận top
              </div>
            </div>
          ) : null}
          {userInfo._id === comment?.user._id && (
            <OptionOnComment commentInfo={{ quesId: ques._id, comment }} />
          )}
        </div>
      </div>
      <div
        className="prose max-w-none tiptap"
        dangerouslySetInnerHTML={{ __html: comment?.content }}
      />
      <div className="w-full flex justify-between items-center gap-2">
        <div className="flex space-x-2 items-center">
          <ReactButton reaction={reaction} handler={handleReaction} />
          <Button
            variant="default"
            className="flex gap-2 items-center text-gray-500"
            onClick={() => {
              setReplyBox(!replyBox);
              setTarget(comment?.user);
            }}
          >
            <MessageCircle style={{ width: "20px", height: "20px" }} />
            Phản hồi
          </Button>
        </div>
        {/*Số lượng reaction & top 3*/}
        <TopReaction likes={comment.likes} />
      </div>
      {comment.replies.length > 0 && (
        <ReplyList
          quesId={ques._id}
          commentId={comment._id}
          setReplyBox={setReplyBox}
          setTarget={setTarget}
          replies={comment.replies}
        />
      )}
      {replyBox && (
        <WriteReply
          quesId={ques._id}
          commentId={comment._id}
          target={replyTarget}
          onCancel={() => setReplyBox(false)}
        />
      )}
    </div>
  );
};

function CommentList({ ques, comments }) {
  const totalComments = comments?.reduce(
    (total, comment) => total + 1 + (comment.replies?.length || 0),
    0
  );

  return (
    <div className="w-full space-y-2 py-2">
      <span className="font-semibold">
        {totalComments > 0
          ? totalComments > 1000000
            ? totalComments / 1000000 + " triệu" //Nếu tổng lượt react >1tr thì hiển thị kiểu 1 triệu, 2 triệu,...
            : totalComments > 1000
            ? totalComments / 1000 + " ngàn"
            : totalComments + //Nếu tổng lượt react >1000 thì hiển thị kiểu 1 ngàn, 2 ngàn,...
              " bình luận"
          : "Chưa có bình luận nào"}
      </span>
      {comments?.map((cmt, index) => {
        return <CommentCard key={index} ques={ques} comment={cmt} />;
      })}
    </div>
  );
}

export default CommentList;
