import React, { useState, useRef, useEffect } from "react";
import { FaCheck } from "react-icons/fa6";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoSpeed = ({ videoRef, containerRef }) => {
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isOpen, setIsOpen] = useState(false);

    const handleSpeedChange = (speed) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
        setPlaybackSpeed(speed);
        setIsOpen(false);
    };

    return (
        <div>
            <DropdownMenu modal={false} open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <button
                        className="hover:bg-white transition-colors cursor-pointer px-2 py-0.5 w-16 bg-gray-100"
                    >
                        <div className="font-extrabold text-black text-sm">{playbackSpeed}x</div>
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    container={containerRef?.current}
                    align="start"
                    side="top"
                    className="w-36 bg-white backdrop-blur-md border rounded-md shadow-lg z-50"
                >
                    <DropdownMenuLabel className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Tốc độ phát
                    </DropdownMenuLabel>

                    {PLAYBACK_SPEEDS.map((speed) => (
                        <DropdownMenuItem
                            key={speed}
                            onSelect={() => handleSpeedChange(speed)}
                            className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-500 px-3 py-1"
                        >
                            <span>{speed === 1 ? "Bình thường" : `${speed}x`}</span>
                            {playbackSpeed === speed && <FaCheck size={12} />}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

        </div>
    );
};


export default VideoSpeed;