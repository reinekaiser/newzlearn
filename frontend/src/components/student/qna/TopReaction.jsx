import React, { useEffect, useState } from 'react'

function TopReaction({likes}) {
    const totalReact = likes?.length;
    const [topReactions, setTopReactions] = useState([]);

    useEffect(() => {
        if (!likes || typeof likes !== "object") {
          setTopReactions([]);
          return;
        }
        const reactionGroups = likes?.reduce((acc, r) => {
          if (!acc[r.type]) {
            acc[r.type] = [];
          }
          acc[r.type].push(r.userId);
          return acc;
        }, {});
        const sortedReactions = Object.entries(reactionGroups)
          .sort((a, b) => b[1].length - a[1].length) // Sắp xếp theo số lượng user
          .slice(0, 3); // Lấy top 3 reactions
        setTopReactions(sortedReactions.map(([reaction]) => reaction));
      }, [likes]); // Chạy lại khi likes thay đổi

  return (
    <span className="text-[15px] text-gray-500 border-gray-400 flex">
          {topReactions.map((reaction) => (
            <img
              src={`/reaction/${reaction}.png`}
              alt={`${reaction}`}
              width={20}
              height={16}
              key={reaction}
            />
          ))}
          &nbsp;
          {
            totalReact > 0 &&
              (totalReact > 1000000
                ? totalReact / 1000000 + "M" //Nếu tổng lượt react >1tr thì hiển thị kiểu 1M, 2M,...
                : totalReact > 1000
                ? totalReact / 1000 + "K"
                : totalReact) //Nếu tổng lượt react >1000 thì hiển thị kiểu 1K, 2K,...
          }
        </span>
  )
}

export default TopReaction