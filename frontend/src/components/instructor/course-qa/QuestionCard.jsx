import Button from "@/components/Button";
import QnATypeBadge from "@/components/student/qna/QnATypeBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateIsReadMutation } from "@/redux/api/qnaSlice";
import { Mail } from "lucide-react";
import React from "react";

function QuestionCard({ qna, selected, setSelected }) {
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
  const [updateIsRead] = useUpdateIsReadMutation();
  return (
    <Card
      className={`px-0 xl:px-2 py-2 xl:py-4 w-full cursor-pointer rounded-none border border-blue-500 hover:bg-gray-100 gap-2 ${
        selected === qna._id ? "border-2" : "border-0"
      } ${qna.isRead ? "" : "bg-blue-100"}`}
      onClick={() => {
        setSelected(qna._id);
        if (!qna.isRead) updateIsRead({ qnaId: qna._id, body: { isRead: true }, courseId: qna.courseId });
      }}
    >
      <CardHeader className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {qna?.author?.profilePicture?.url ? (
            <div className="rounded-full ring-ring ring-2">
              <img
                className="w-6 h-6 xl:w-8 xl:h-8"
                src={qna?.author?.profilePicture.url}
                alt={qna?.author?.firstName + " " + qna?.author?.lastName}
              /> 
            </div>) : (
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs">
              {qna?.author?.firstName[0].toUpperCase()}
              {qna?.author?.lastName[0].toUpperCase()}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <CardTitle className="text-[1rem] flex flex-col xl:flex-row items-start xl:items-center gap-1 text-nowrap">
              {qna?.author?.firstName} {qna?.author?.lastName}
            </CardTitle>
            <CardDescription>
            <p className="font-normal text-[0.7rem]">
                {timeAgo(new Date(qna?.createdAt))}
              </p>
  
            </CardDescription>
          </div>
        </div>
        {qna.isRead && (
          <Button
            onClick={async(e) => {
              e.stopPropagation(); // tránh gọi onClick của Card
              updateIsRead({ qnaId: qna._id, body: { isRead: false }, courseId: qna.courseId });
              setSelected(null)              
            }}
            className="!p-2 disabled:pointer-events-none disabled:text-gray-300 disabled:border-none"
            title="Đánh dấu là chưa đọc"
          >
            <Mail className="w-[1rem] h-[1rem]" />
          </Button>
        )}
      </CardHeader>
      <CardContent>        
        <p className="text-[0.9rem] truncate mb-2">{qna.title}</p>
        <QnATypeBadge type={qna?.type} />
      </CardContent>
    </Card>
  );
}

export default QuestionCard;
