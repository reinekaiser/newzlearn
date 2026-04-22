import VideoNoteMarkers from '@/components/student/course-detail/VideoNoteMarkers';
import VideoQuestionMarkers from '@/components/student/course-detail/VideoQuestionMarkers';
import React, { useEffect, useRef, useState } from 'react';

const VideoProgress = ({
    className = "",
    progressRef,
    videoRef,
    buffered,
    dragPercent,
    setDragPercent,
    questionMarkers,
    handleMarkerClick,
    noteMarkers,
    isFullscreen,
    containerRef
}) => {

    const isMouseDownRef = useRef(false);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);

    const duration = videoRef.current?.duration || 0;
    const currentTime = videoRef.current?.currentTime || 0;
    const percent =
        dragPercent !== null
            ? dragPercent
            : duration > 0
                ? (currentTime / duration) * 100
                : 0;


    const seekByClientX = (clientX) => {
        if (!progressRef.current) return;

        const rect = progressRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const newPercent = (x / rect.width) * 100;
        const newTime = (newPercent / 100) * duration;

        setDragPercent(newPercent);
        handleSeek?.(newTime);

    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        isMouseDownRef.current = true;
        isDraggingRef.current = false;
        startXRef.current = e.clientX;
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isMouseDownRef.current) return;

            const delta = Math.abs(e.clientX - startXRef.current);

            if (delta > 3) {
                isDraggingRef.current = true;
                seekByClientX(e.clientX);
            }
        };

        const handleMouseUp = (e) => {
            if (!isMouseDownRef.current) return;

            if (!isDraggingRef.current) {
                seekByClientX(e.clientX);
            }

            isMouseDownRef.current = false;
            isDraggingRef.current = false;
            setDragPercent(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragPercent, duration]);



    const handleSeek = (time) => {
        const video = videoRef.current;
        if (!video || isNaN(time)) return;

        video.currentTime = Math.min(Math.max(time, 0), duration);
    };

    return (
        <div
            ref={progressRef}
            className={`${className} mx-4 bg-gray-200`}
            onMouseDown={handleMouseDown}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
        >
            {/* Buffered */}
            <div
                className="absolute h-full bg-blue-200"
                style={{ width: `${buffered}%` }}
            />

            {/* Progress */}
            <div
                className="absolute h-full bg-blue-400"
                style={{ width: `${percent}%` }}
            />

            {/* Thumb */}
            <div
                className="absolute w-4 h-4 bg-blue-400 border border-blue-200 z-50
                                rounded-full shadow-sm scale-0
                                group-hover/progress:scale-100 transition-transform"
                style={{ left: `calc(${percent}% - 8px)` }}
            />

            {videoRef && (<VideoQuestionMarkers
                markers={questionMarkers}
                duration={duration}
                onMarkerClick={handleMarkerClick}
            />)}

            {videoRef && (<VideoNoteMarkers
                markers={noteMarkers}
                duration={duration}
                onMarkerClick={handleMarkerClick}
                containerRef={containerRef}
            />)}


        </div>
    )
}

export default VideoProgress