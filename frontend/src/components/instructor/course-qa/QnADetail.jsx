import QnATypeBadge from "@/components/student/qna/QnATypeBadge";
import { Spinner } from "@/components/ui/spinner";
import { useGetQnAByIdQuery } from "@/redux/api/qnaSlice";
import {
  CircleCheck,
  CircleQuestionMark,
  MessageSquareDot,
} from "lucide-react";
import React from "react";
import WriteAnswer from "./WriteAnswer";
import InstructorCommentList from "./InstructorCommentList";

function QnADetail({ selectedId }) {
  const { data, isLoading: isLoadingGetQnAById } =
    useGetQnAByIdQuery(selectedId, { skip: !selectedId });
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

  if (!selectedId) {
    return (
      <div className="flex w-full h-full items-center justify-center gap-2 z-50">
        <MessageSquareDot className="text-[1rem]" />
        <p className="text-gray-700 text-[1rem]">Hãy chọn mục hỏi đáp.</p>
      </div>
    );
  }
  if (isLoadingGetQnAById)
    return (
      <div className="flex h-full items-center justify-center z-50">
        <Spinner className="size-12" color="#098ce9" />
      </div>
    );
  return (
    <div className="flex w-full flex-col px-2 space-y-2 overflow-y-auto overflow-x-hidden min-w-0 mb-10">
      <div className="w-full flex items-center gap-2 p-2 border-b-1">
        <p>
          <span className="font-semibold">Khóa học: </span>
          {data?.courseId?.title}
        </p>
        <p>
          <span className="font-semibold">Bài học: </span>
          {data?.lectureId?.title}
        </p>
      </div>
      <div className="w-full flex justify-between items-center gap-2 p-2">
        <p className="text-lg font-semibold">
          {data?.title}&nbsp;&nbsp;
          <QnATypeBadge type={data?.type} />
        </p>
      </div>
      <div className="w-full flex justify-between items-center gap-2 p-2">
        <div className="flex space-x-2 items-center">
          {data?.author?.profilePicture?.url ? (
            <img
                className="w-10 h-10 rounded-full border-1 border-[#098be4]"
                src={data?.author?.profilePicture.url}
                alt={data?.author?.firstName + " " + data?.author?.lastName}
            />) : (
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm">
              {data?.author?.firstName[0].toUpperCase()}
              {data?.author?.lastName[0].toUpperCase()}
            </div>
          )}
          <p className="font-semibold">
            {data?.author.firstName} {data?.author.lastName}
          </p>
          <p className="text-sm text-gray-700">{timeAgo(data?.createdAt)}</p>
        </div>
        {data?.isSolved ? (
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
        className="prose max-w-none tiptap" 
        dangerouslySetInnerHTML={{ __html: data?.content }}
      />
       {!data.isSolved && <WriteAnswer quesId={data._id} courseId={data?.courseId?._id}/>}
       <InstructorCommentList ques={data} comments={data?.comments} courseId={data?.courseId?._id}/>
    
    </div>
  );
}

export default QnADetail;
