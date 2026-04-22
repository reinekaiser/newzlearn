import React, { useMemo } from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { StickyNote } from "lucide-react";

const VideoNoteMarkers = ({ markers = [], duration = 0, onMarkerClick, containerRef }) => {

    const validMarkers = useMemo(() => {
        if (!duration || duration <= 0) return [];

        return markers
            .filter(m => m.time >= 0 && m.time <= duration)
            .map(m => ({
                ...m,
                position: (m.time / duration) * 100
            }));
    }, [markers, duration]);

    if (!duration) return null;

    const formatTime = (seconds) => {
        const date = new Date(seconds * 1000);
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const ss = date.getUTCSeconds().toString().padStart(2, '0');
        if (date.getUTCHours() > 0) {
            const hh = date.getUTCHours().toString().padStart(2, '0');
            return `${hh}:${mm}:${ss}`;
        }
        return `${mm}:${ss}`;
    };

    return (
        <TooltipProvider delayDuration={100}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {validMarkers.map((marker) => (
                    <Tooltip key={marker.id}>
                        <TooltipTrigger asChild>
                            <div
                                className="group absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer pointer-events-auto z-40 hover:z-50 py-3"
                                style={{ left: `${marker.position}%` }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkerClick && onMarkerClick(marker);
                                }}
                            >
                                <div className="w-1 h-2.5 bg-white transition-all duration-200 group-hover:scale-125 " />
                            </div>
                        </TooltipTrigger>

                        <TooltipContent 
                            side="top" 
                            sideOffset={7}
                            container={containerRef?.current}
                            arrowClassName="fill-white bg-white"
                            className="bg-white text-gray-900 border border-gray-200 shadow-xl p-3 rounded-lg max-w-[300px] animate-in fade-in zoom-in-95 duration-200 z-50"
                        >
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-1.5 mb-0.5">
                                    <div className="flex items-center gap-1.5 text-blue-600">
                                        <StickyNote size={14} /> 
                                        <span className="text-xs font-bold uppercase tracking-wide">Ghi chú</span>
                                    </div>
                                    <span className="text-xs font-mono font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                        {formatTime(marker.time)}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-700 leading-relaxed break-words font-medium">
                                    {marker.content}
                                </p>
                            </div>
                            
                            
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
        </TooltipProvider>
    );
};

export default VideoNoteMarkers;