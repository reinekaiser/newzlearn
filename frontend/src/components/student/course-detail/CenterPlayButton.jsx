import React from "react";
import { FaPlay } from "react-icons/fa"
const CenterPlayButton = ({ visible, onClick }) => {
    if (!visible) return null;

    return (
        <div
            className="
                absolute inset-0
                flex items-center justify-center
                bg-black/20
                transition-opacity
                z-30
            "
            onClick={onClick}
        >
            <button
                className="
                    w-15 h-15 rounded-full
                    bg-black/40 hover:bg-black/60
                    flex items-center justify-center
                    transition-transform hover:scale-105
                "
            >
                <FaPlay className="w-7 h-7 text-white ml-1.5 mt-0.5"/>
            </button>
        </div>
    );
};

export default CenterPlayButton;