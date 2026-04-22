import React, { useState, useRef, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FaCog } from "react-icons/fa";
import { FaCheck } from "react-icons/fa6";


const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const VideoSettings = ({ videoRef, containerRef,
    availableLanguages,
    qualities = [],
    currentQuality = -1,
    onQualityChange
}) => {

    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [currentLang, setCurrentLang] = useState("off");

    const handleSpeedChange = (speed) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
        }
        setPlaybackSpeed(speed);
    };

    const handleLanguageChange = (langCode) => {
        const video = videoRef.current;
        if (!video) return;

        const tracks = video.textTracks;
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].language === langCode) {
                tracks[i].mode = 'showing';
                setCurrentLang(langCode);
            } else {
                tracks[i].mode = 'disabled';
            }
        }

        if (langCode === "off") {
            setCurrentLang("off");
        }
    };

    return (
        <div>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <button className="hover:text-white transition-colors cursor-pointer outline-none">
                        <FaCog size={20} className='mt-1' />
                    </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                    container={containerRef?.current}
                    align="end"
                    side="left"
                    className="w-40 bg-white backdrop-blur-md border rounded-md shadow-lg z-50"
                >
                    {/* tốc độ */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger
                            className={`text-gray-600 font-semibold`}
                        >
                            Tốc độ
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                container={containerRef?.current}
                                className={`text-gray-500 font-semibold`}
                            >
                                {PLAYBACK_SPEEDS.map((speed) => (
                                    <DropdownMenuItem
                                        key={speed}
                                        onSelect={() => handleSpeedChange(speed)}
                                        className="flex items-center justify-between cursor-pointer text-xs font-semibold text-gray-500 px-3 py-1"
                                    >
                                        <span>{`${speed}x`}</span>
                                        {playbackSpeed === speed && <FaCheck size={12} />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>

                    {/* caption */}
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="text-gray-600 font-semibold cursor-pointer">
                            Phụ đề
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                            <DropdownMenuSubContent
                                container={containerRef?.current}
                                className={`text-gray-500 font-semibold`}
                            >
                                <DropdownMenuItem
                                    onSelect={() => handleLanguageChange("off")}
                                    className="flex items-center justify-between cursor-pointer text-xs px-3 py-1"
                                >
                                    <span>Tắt</span>
                                    {currentLang === "off" && <FaCheck size={10} />}
                                </DropdownMenuItem>

                                {availableLanguages.map((lang) => (
                                    <DropdownMenuItem
                                        key={lang.srclang}
                                        onSelect={() => handleLanguageChange(lang.srclang)}
                                        className="flex items-center justify-between cursor-pointer text-xs px-3 py-1"
                                    >
                                        <span>{lang.label}</span>
                                        {currentLang === lang.srclang && <FaCheck size={10} />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                    </DropdownMenuSub>


                    {/* chất lượng */}
                    {qualities.length > 0 && (
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="text-gray-600 font-semibold cursor-pointer">
                                Chất lượng
                            </DropdownMenuSubTrigger>

                            <DropdownMenuPortal>
                                <DropdownMenuSubContent
                                    container={containerRef?.current}
                                    className={`text-gray-500 font-semibold`}
                                >
                                    <DropdownMenuItem
                                        onSelect={() => onQualityChange(-1)}
                                        className="flex items-center justify-between cursor-pointer text-xs px-3 py-1.5 hover:bg-gray-100"
                                    >
                                        <span>Tự động</span>
                                        {currentQuality === -1 && <FaCheck size={10} className="" />}
                                    </DropdownMenuItem>

                                    {qualities.map((q) => (
                                        <DropdownMenuItem
                                            key={q.index}
                                            onSelect={() => onQualityChange(q.index)}
                                            className="flex items-center justify-between cursor-pointer text-xs px-3 py-1.5 hover:bg-gray-100"
                                        >
                                            <span>{q.height}p</span>
                                            {currentQuality === q.index && <FaCheck size={10} className="text-blue-500" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

export default VideoSettings