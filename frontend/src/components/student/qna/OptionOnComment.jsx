import Button from "@/components/Button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDeleteCommentMutation,
  useUpdateCommentMutation,
} from "@/redux/api/qnaSlice";
import MyRichTextEditor from "./MyRTE";
import { EllipsisVertical, Pencil, Trash } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";

const DeleteOption = ({ commentInfo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteComment, { isLoading }] = useDeleteCommentMutation();

  const handleDelete = async () => {
    try {
      await deleteComment({
        qnaId: commentInfo.quesId,
        commentId: commentInfo.comment._id,
      });
      setIsOpen(false);
    } catch (error) {
      console.log("Lỗi khi xóa bình luận: ", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center space-x-2 text-red-500">
          <Trash className="w-4 h-4" />
          <p>Xóa bình luận</p>
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Xóa bình luận</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p>
            Bạn có chắc chắn muốn xóa bình luận này không?{" "}
            <span className="font-semibold">
              Hành động này sẽ không thể hoàn tác!
            </span>
          </p>
          <div className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Hủy
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={isLoading}
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
const EditOption = ({ commentInfo }) => {
  const [content, setContent] = useState(commentInfo.comment.content);
  const [isOpen, setIsOpen] = useState(false);
  const [updateComment, { isLoading }] = useUpdateCommentMutation();

  const handleUpdate = async () => {
    try {
      await updateComment({
        qnaId: commentInfo.quesId,
        commentId: commentInfo.comment._id,
        body: { content },
      });
      setIsOpen(false);
    } catch (error) {
      console.log("Lỗi khi cập nhật bình luận: ", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center space-x-2">
          <Pencil className="w-4 h-4" />
          <p>Sửa bình luận</p>
        </Button>
      </DialogTrigger>
      <DialogContent
        className="!max-w-4xl !w-full max-h-[90vh]"
        aria-describedby={undefined}
      >
        {isLoading ? (
          <div className="flex h-full items-center justify-center z-50">
            <Spinner className="size-12" color="#098ce9" />
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <DialogTitle>Sửa bình luận</DialogTitle>
            <MyRichTextEditor
              value={content}
              onChange={setContent}
              className="w-full h-[200px] text-gray-200"
              placeholder="Nhập nội dung bình luận của bạn"
              mention={null}
            />
            <div className="flex justify-end space-x-2">
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button variant="reverse" onClick={handleUpdate}>
                Cập nhật
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

function OptionOnComment({ commentInfo }) {
  // commentInfo={{quesId, comment}}
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="icon">
          <EllipsisVertical className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={"w-full transition -translate-x-1/3"}>
        <EditOption commentInfo={commentInfo} />
        <DeleteOption commentInfo={commentInfo} />
      </PopoverContent>
    </Popover>
  );
}

export default OptionOnComment;
