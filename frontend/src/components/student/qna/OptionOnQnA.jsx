import Button from "@/components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  useDeleteQnAMutation,
  useUpdateQnAMutation,
} from "@/redux/api/qnaSlice";
import { EllipsisVertical, Pencil, Trash } from "lucide-react";
import React, { useState } from "react";
import MyRichTextEditor from "./MyRTE";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DeleteOption = ({ ques , getBack }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteQnA, { isLoading }] = useDeleteQnAMutation();

  const handleDelete = async () => {
    try {
      await deleteQnA({
        qnaId: ques._id,
      });
      setIsOpen(false);
        getBack();
    } catch (error) {
      console.log("Lỗi khi xóa câu hỏi: ", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center space-x-2 text-red-500">
          <Trash className="w-4 h-4" />
          <p>Xóa câu hỏi</p>
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Xóa câu hỏi</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <p>
            Bạn có chắc chắn muốn xóa câu hỏi này không?{" "}
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

const EditOption = ({ ques }) => {
  const [type, setType] = useState(ques.type);
  const [title, setTitle] = useState(ques.title);
  const [content, setContent] = useState(ques.content);
  const [isOpen, setIsOpen] = useState(false);
  const [updateQnA, { isLoading }] = useUpdateQnAMutation();

  const handleUpdate = async () => {
    try {
      await updateQnA({
        qnaId: ques._id,
        body: { type, title, content },
      });
      setIsOpen(false);
    } catch (error) {
      console.log("Lỗi khi cập nhật câu hỏi: ", error);
    }
  };
  const types = [
    "Bài học lý thuyết",
    "Bài học thử thách",
    "Chủ đề ngoài khóa học",
    "Các loại bài tập khác",
  ];
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full flex items-center space-x-2">
          <Pencil className="w-4 h-4" />
          <p>Sửa câu hỏi</p>
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
            <DialogTitle>Sửa câu hỏi</DialogTitle>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => {
                  return (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-2 w-full border border-1 border-gray-200 focus:border-[#098be4] rounded"
              placeholder="Nhập tiêu đề cuộc thảo luận..."
            />
            <MyRichTextEditor
              value={content}
              onChange={setContent}
              className="w-full h-[200px] text-gray-200"
              placeholder="Nhập chi tiết nội dung của bạn"
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

function OptionOnQnA({ ques , getBack}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="icon">
          <EllipsisVertical className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={"w-full transition -translate-x-1/3"}>
        <EditOption ques={ques} />
        <DeleteOption ques={ques} getBack={getBack}/>
      </PopoverContent>
    </Popover>
  );
}

export default OptionOnQnA;
