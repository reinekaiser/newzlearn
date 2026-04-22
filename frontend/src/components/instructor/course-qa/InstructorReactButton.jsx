import Button from "@/components/Button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ThumbsUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const InstructorReactButton = ({ reaction, handler }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReaction = (newReaction) => {
    handler(newReaction);
    setIsOpen(false);
  }

  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          className={`flex items-center gap-2 text-[15px]
                ${
                  reaction == "like"
                    ? "text-blue-600"
                    : reaction == "love"
                    ? "text-red-600"
                    : reaction == "haha" ||
                      reaction == "sad" ||
                      reaction == "wow"
                    ? "text-yellow-400"
                    : reaction == "angry"
                    ? "text-orange-500"
                    : "text-gray-500"
                }
              `}
        >
          {reaction == "like" ? (
            <img src={"/reaction/like.png"} alt="haha" width={24} height={24} />
          ) : reaction == "love" ? (
            <img
              src={"/reaction/love.png"}
              alt="haha"
              width={24}
              height={24}
            />
          ) : reaction == "haha" ? (
            <img
              src={"/reaction/haha.png"}
              alt="haha"
              width={24}
              height={24}
            />
          ) : reaction == "wow" ? (
            <img src={"/reaction/wow.png"} alt="haha" width={24} height={24} />
          ) : reaction == "sad" ? (
            <img src={"/reaction/sad.png"} alt="haha" width={24} height={24} />
          ) : reaction == "angry" ? (
            <img
              src={"/reaction/angry.png"}
              alt="haha"
              width={24}
              height={24}
            />
          ) : (
            <ThumbsUp style={{ width: "20px", height: "20px" }} />
          )}
          {reaction == "love"
            ? "Yêu thích"
            : reaction == "haha"
            ? "Haha"
            : reaction == "wow"
            ? "Wow"
            : reaction == "sad"
            ? "Buồn"
            : reaction == "angry"
            ? "Phẫn nộ"
            : "Thích"}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="bg-[#cee8fb] text-neutral-950 [&_svg]:bg-[#cee8fb] [&_svg]:fill-[#cee8fb]">
        <div
          className={
            "flex gap-1 transition-all opacity-100 scale-100 translate-y-0 rounded-2xl mb-2"
          }
        >
          <motion.button
            whileHover={{ scale: 2 }} //phóng to biểu tượng lên
            className="px-2 py-2"
            onClick={() => {
              handleReaction("like");
            }}
          >
            <img
              src={"/reaction/like.gif"}
              alt="like"
              width={30}
              height={30}
              unoptimized="true"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 2 }}
            className="px-2 py-2"
            onClick={() => {
              handleReaction("love");
            }}
          >
            <img
              src={"/reaction/love.gif"}
              alt="love"
              width={30}
              height={30}
              unoptimized="true"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 2 }}
            className="px-2 py-2"
            onClick={() => {
              handleReaction("haha");
            }}
          >
            <img
              src={"/reaction/haha.gif"}
              alt="haha"
              width={30}
              height={30}
              unoptimized="true"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 2 }}
            className="px-2 py-2"
            onClick={() => {
              handleReaction("wow");
            }}
          >
            <img
              src={"/reaction/wow.gif"}
              alt="wow"
              width={30}
              height={30}
              unoptimized="true"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 2 }}
            className="px-2 py-2"
            onClick={() => {
              handleReaction("sad");
            }}
          >
            <img
              src={"/reaction/sad.gif"}
              alt="sad"
              width={30}
              height={30}
              unoptimized="true"
            />
          </motion.button>
          <motion.button
            whileHover={{ scale: 2 }}
            className="px-2 py-2"
            onClick={() => {
              handleReaction("angry");
            }}
          >
            <img
              src={"/reaction/angry.gif"}
              alt="angry"
              width={30}
              height={30}
              unoptimized="true"
            />
          </motion.button>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default InstructorReactButton;
