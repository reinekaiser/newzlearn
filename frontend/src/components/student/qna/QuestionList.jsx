import React from "react";
import { CircleCheck, CircleQuestionMark } from "lucide-react";
import QnATypeBadge from "./QnATypeBadge";

function QuestionList({ list, handleQuestionClick }) {
  return (
    <div className="flex w-full flex-col gap-2 overflow-y-auto max-h-[500px]">
      {list?.map((ques) => {
        return (
          <div
            key={ques._id}
            className="w-full flex items-center gap-2 hover:text-[#098be4] hover:bg-[#cee8fb] p-2 rounded-md cursor-pointer"
            onClick={() => {
              handleQuestionClick(ques);
            }}
          >
            {!ques.isSolved ? (
              <CircleQuestionMark className="text-gray-500" />
            ) : (
              <CircleCheck className="text-green-500" />
            )}
            <p className="max-w-2/3 truncate">{ques.title}</p>
            <QnATypeBadge type={ques.type} />
          </div>
        );
      })}
    </div>
  );
}

export default QuestionList;
