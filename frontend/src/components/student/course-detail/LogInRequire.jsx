import Button from "@/components/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React from "react";

function LogInRequire({ course }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full text-[#098ce9] border-2 border-[#098ce9] hover:bg-sky-50 font-semibold py-3 rounded-sm transition duration-200"
        >
          Mua ngay
        </Button>
      </DialogTrigger>
      <DialogContent>
        <div className="p-4">
          <DialogTitle className="text-lg font-semibold mb-4">
            Yêu cầu đăng nhập
          </DialogTitle>
          <DialogDescription className="mb-4">
            Vui lòng đăng nhập để tiếp tục mua khóa học này.
          </DialogDescription>
          <div className="flex justify-end space-x-2">
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button
              variant="reverse"
              // onClick={() => (window.location.href = "/login")} Chưa có trang đăng nhập rời
            >
              Đăng nhập
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LogInRequire;
