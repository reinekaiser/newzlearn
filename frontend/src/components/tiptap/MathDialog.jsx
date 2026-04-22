"use client";
import React from "react";
import katex from "katex";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button as ShadcnButton } from "@/components/ui/button";

export const MathDialog = ({
  isOpen,
  onClose,
  onSubmit,
  type,
  initialValue = "", // Thêm prop này để edit
}) => {
  const [latex, setLatex] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setLatex(initialValue);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = React.useCallback(() => {
    if (latex.trim()) {
      onSubmit(latex);
      setLatex("");
      onClose();
    }
  }, [latex, onSubmit, onClose]);

  const handleOpenChange = React.useCallback(
    (open) => {
      if (!open) {
        setLatex("");
        onClose();
      }
    },
    [onClose]
  );

  const renderPreview = () => {
    if (!latex) {
      return <span>Preview sẽ hiển thị ở đây</span>;
    }

    return (
      <span
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(latex, {
            throwOnError: false,
            displayMode: type === "block",
          }),
        }}
      ></span>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[500px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialValue ? "Chỉnh sửa" : "Thêm"} công thức {type === "inline" ? "inline" : "block"}
          </DialogTitle>
          <DialogDescription>
            Nhập công thức LaTeX của bạn. Nhấn Enter để {initialValue ? "cập nhật" : "thêm"} nhanh.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="Ví dụ: x^2 + y^2 = z^2"
            autoFocus
            rows={type === 'block' ? 4 : 2}
            className="w-full resize-none p-3 outline-none border border-gray-300 rounded-md"
          />

          <div className="p-4 rounded-md min-h-[80px] border border-gray-300 flex items-center justify-center">
            {renderPreview()}
          </div>

          <div className="text-sm space-y-1">
            <p className="font-semibold">Ví dụ LaTeX:</p>
            <ul className="space-y-0.5 pl-4">
              <li>
                • Phân số: \frac{"{a}"}
                {"{b}"}
              </li>
              <li>• Căn: \sqrt{"{x}"}</li>
              <li>
                • Tổng: \sum_{"{i=1}"}^{"{n}"} x_i
              </li>
              <li>
                • Tích phân: \int_{"{a}"}^{"{b}"} f(x) dx
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <ShadcnButton variant="outline" onClick={onClose} className="rounded-sm">
            Hủy
          </ShadcnButton>
          <ShadcnButton onClick={handleSubmit} className="rounded-sm" disabled={!latex.trim()}>
            {initialValue ? "Cập nhật" : "Thêm công thức"}
          </ShadcnButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

class MathEventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((callback) => callback(data));
  }
}

export const mathEventBus = new MathEventBus();

export function MathDialogManager() {
  const [dialogState, setDialogState] = React.useState({
    isOpen: false,
    type: "inline",
    initialValue: "",
    onUpdate: null,
  });

  React.useEffect(() => {
    const handleOpenDialog = (data) => {
      setDialogState({
        isOpen: true,
        type: data.type,
        initialValue: data.latex || "",
        onUpdate: data.onUpdate,
      });
    };

    mathEventBus.on("openMathDialog", handleOpenDialog);

    return () => {
      mathEventBus.off("openMathDialog", handleOpenDialog);
    };
  }, []);

  const handleClose = () => {
    setDialogState({
      isOpen: false,
      type: "inline",
      initialValue: "",
      onUpdate: null,
    });
  };

  const handleSubmit = (latex) => {
    console.log(latex);
    console.log(dialogState.onUpdate);
    if (dialogState.onUpdate) {
      dialogState.onUpdate(latex);
    }
  };

  return (
    <MathDialog
      isOpen={dialogState.isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      type={dialogState.type}
      initialValue={dialogState.initialValue}
    />
  );
}
