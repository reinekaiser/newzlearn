import React from "react";

function QnATypeBadge({ type }) {
  return (
    <span
      className={`whitespace-nowrap font-normal text-[0.8rem] text-white py-1 px-2 rounded ${
        type === "Bài học lý thuyết"
          ? "bg-[#098be4]"
          : type === "Bài học thử thách"
          ? "bg-[#FE9900]"
          : type === "Chủ đề ngoài khóa học"
          ? "bg-[#7DDA58]"
          : "bg-[#FFDE59]"
      }`}
    >
      {type}
    </span>
  );
}

export default QnATypeBadge;
