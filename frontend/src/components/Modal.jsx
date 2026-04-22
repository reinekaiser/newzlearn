import { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, children, title, size = "md" }) => {
  useEffect(() => {
  const handleEscape = (e) => {
    if (e.key === "Escape") onClose();
  };

  if (isOpen) {
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // khóa scroll
  }

  return () => {
    document.removeEventListener("keydown", handleEscape);
    document.body.style.overflow = ""; // mở scroll khi modal đóng/unmount
  };
}, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 transition-all duration-300">
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeClasses[size]} 
        overflow-hidden transform transition-all duration-300 scale-80 animate-in fade-in-0 zoom-in-95`}
      >
        {/* Header */}
        <div className="bg-[#27B5FC] rounded-t-2xl p-5 text-white flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-hidden">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
