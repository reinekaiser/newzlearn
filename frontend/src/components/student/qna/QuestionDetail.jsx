import { Spinner } from "@/components/ui/spinner";
import { CircleCheck, CircleQuestionMark } from "lucide-react";
import React, { useEffect, useState } from "react";
import WriteComment from "./WriteComment";
import CommentList from "./CommentList";
import { useGetQnAByIdQuery } from "@/redux/api/qnaSlice";
import Button from "@/components/Button";
import QnATypeBadge from "./QnATypeBadge";
import { useSelector } from "react-redux";
import OptionOnQnA from "./OptionOnQnA";

function QuestionDetail({ quesId, getBack }) {
  const {userInfo} = useSelector((state) => state.auth);
  const [detail, setDetail] = useState(null);
  const { data , isLoading : isLoadingGetQnAById} = useGetQnAByIdQuery(quesId)

  useEffect(() => {
    if (!data) return;
    setDetail(data)
  }, [data]);

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

  if (isLoadingGetQnAById)
    return (
      <div className="flex h-full items-center justify-center z-50">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );

  return (
    <div className="flex w-full flex-col px-4 space-y-2 overflow-y-auto mb-10">
      <div className="w-full flex justify-between items-center gap-2 p-2">
        <p className="text-lg font-semibold">{detail?.title}&nbsp;&nbsp;<QnATypeBadge type={detail?.type}/></p>
        {userInfo._id === detail?.author._id && <OptionOnQnA ques={detail} getBack={getBack}/>}
      </div>
      <div className="w-full flex justify-between items-center gap-2 p-2">
        <div className="flex space-x-2 items-center">
          <img
            src={detail?.author.profilePicture.url || "/placeholder.svg"}
            className="w-10 h-10 rounded-full border-1 border-[#098be4]"
          />
          <p className="font-semibold">{detail?.author.firstName} {detail?.author.lastName}</p>
          <p className="text-sm text-gray-700">{timeAgo(detail?.createdAt)}</p>
        </div>
        {detail?.isSolved ? (
          <div className="flex items-center text-green-500 gap-2 text-sm">
            <CircleCheck />
            Đã trả lời
          </div>
        ) : (
          <div className="flex items-center text-gray-500 gap-2 text-sm">
            <CircleQuestionMark />
            Chưa trả lời
          </div>
        )}
      </div>
      {/* Hiển thị nội dung HTML từ file txt */}
      <div
        className="prose max-w-none tiptap" // cái link nó ko có màu nên phải thêm tailwind vô
        dangerouslySetInnerHTML={{ __html: detail?.content }}
      />
      <WriteComment quesId={quesId} />

      <CommentList ques={detail} comments={detail?.comments} />
    </div>
  );
}

export default QuestionDetail;
