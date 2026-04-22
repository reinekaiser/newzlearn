import Button from "@/components/Button";
import { useUpvoteCommentMutation } from "@/redux/api/qnaSlice";
import { ArrowBigUp } from "lucide-react";
import React from "react";

function UpvoteButton({quesId, commentId, courseId}) {
   const [upvoteComment] = useUpvoteCommentMutation()
    const handleSolve = async() =>{
        try {
            await upvoteComment({qnaId:quesId, commentId, courseId})
        } catch (error) {
            console.log("Lỗi khi đánh dấu top comment: ", error)
        }
    }
  return (
    <Button variant="reverse" className="flex items-center space-x-2" onClick={handleSolve}>
      <ArrowBigUp className="w-4 h-4"/>
      <p>Top Comment</p>
    </Button>
  );
}

export default UpvoteButton;
