import React from 'react';
import { MdReplay5, MdForward5 } from "react-icons/md";

const VideoSeekButtons = ({ videoRef }) => {
    
    const handleSeek = (amount) => {
        if (!videoRef.current) return;
        const newTime = videoRef.current.currentTime + amount;
        videoRef.current.currentTime = Math.min(
            Math.max(newTime, 0), 
            videoRef.current.duration
        );
    };

    return (
        <div className="flex items-center gap-2">
            <button 
                onClick={() => handleSeek(-5)}
                className="hover:text-white text-gray-300 transition-colors cursor-pointer"
            >
                <MdReplay5 size={24} />
            </button>
            <button 
                onClick={() => handleSeek(5)}
                className="hover:text-white text-gray-300 transition-colors cursor-pointer"
            >
                <MdForward5 size={24} />
            </button>
        </div>
    );
};

export default VideoSeekButtons;