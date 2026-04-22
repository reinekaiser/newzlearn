// Button.jsx
export default function Button({ children, variant = "default", className = "", ...props }) {
    let baseStyle =
      "rounded font-medium transition duration-200 cursor-pointer";
  
    let styles = "";
  
    switch (variant) {
      case "default":
        styles =
          "px-4 py-2 bg-white text-black hover:text-[#098be4] hover:bg-[#cee8fb]";
        break;
      case "outline":
        styles =
          "px-4 py-2 bg-white text-[#098be4] border border-[#098be4] hover:text-[#098be4] hover:bg-[#cee8fb]";
        break;
      case "reverse":
        styles =
          "px-4 py-2 bg-[#098be4] text-white hover:bg-[#cee8fb] hover:text-[#098be4]";
        break;
      case "icon":
        styles =
          "bg-white text-black hover:text-[#098be4] hover:bg-[#cee8fb] p-2";
        break;
      case "destructive":
        styles = 
          "px-4 py-2 bg-red-500 text-white hover:bg-red-900";
        break;
      default:
        styles =
          "bg-white text-black hover:text-[#098be4] hover:bg-[#cee8fb]";
    }
  
    return (
      <button
        {...props}
        className={`${baseStyle} ${styles} ${className}`}
      >
        {children}
      </button>
    );
  }
  