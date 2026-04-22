import VideoProgress from '@/components/student/course-detail/VideoProgress';
import VideoSeekButtons from '@/components/student/course-detail/VideoSeekButtons';
import VideoSpeed from '@/components/student/course-detail/VideoSpeed';
import { formatTimeShort } from '@/utils';
import React, { useEffect, useRef, useState } from 'react';
import { FaVolumeMute, FaVolumeUp } from "react-icons/fa";
import { LuMaximize } from "react-icons/lu";
import { FaCheck } from "react-icons/fa6";
import { FaPlay, FaPause, FaCog } from "react-icons/fa";
import VideoSettings from '@/components/student/course-detail/VideoSettings';
import VideoQuestionMarkers from '@/components/student/course-detail/VideoQuestionMarkers';


const VideoControls = ({ className = "",
    buffered = 0, duration = 0, currentTime = 0,
    isPlaying, isFullscreen, videoRef, toggleFullscreen, handleTogglePlay, containerRef,
    availableLanguages, qualities, currentQuality, onQualityChange,
    questionMarkers, noteMarkers
}) => {
    const controlsRef = useRef(null);
    const [compact, setCompact] = useState(false);

    const progressRef = useRef(null);
    const [dragPercent, setDragPercent] = useState(null);

    const percent =
        dragPercent !== null
            ? dragPercent
            : duration > 0
                ? (currentTime / duration) * 100
                : 0;

    useEffect(() => {
        if (!controlsRef.current) return;

        const observer = new ResizeObserver(([entry]) => {
            const width = entry.contentRect.width;
            setCompact(width < 520);
        });

        observer.observe(controlsRef.current);
        return () => observer.disconnect();
    }, []);

    const handleMarkerClick = (marker) => {
        if (videoRef.current) {
            videoRef.current.currentTime = marker.time;
        }
    };

    return (
        <div ref={controlsRef} className={className}>
            <VideoProgress
                className="relative h-1.5 bg-gray-100 cursor-pointer mb-4
                            group/progress flex items-center hover:h-2 duration-200
                            select-none"
                progressRef={progressRef}
                videoRef={videoRef}
                buffered={buffered}
                dragPercent={dragPercent}
                setDragPercent={setDragPercent}
                questionMarkers={questionMarkers}
                handleMarkerClick={handleMarkerClick}
                noteMarkers={noteMarkers}
                isFullscreen={isFullscreen}
                containerRef={containerRef}
            />

            {compact ? (
                <CompactControls
                    videoRef={videoRef}
                    isPlaying={isPlaying}
                    toggleFullscreen={toggleFullscreen}
                    containerRef={containerRef}
                    duration={duration}
                    percent={percent}
                    availableLanguages={availableLanguages}
                />
            ) : (
                <div className="flex items-center justify-between text-gray-300 px-4">
                    <div className="flex items-center gap-3">
                        <button onClick={handleTogglePlay} className="hover:text-white text-gray-300 transition-colors cursor-pointer">
                            {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                        </button>

                        <VideoSeekButtons videoRef={videoRef} />

                        {/* Thời gian */}
                        <div className="flex items-center text-xs gap-1 ml-2 hover:text-white cursor-default">
                            <span>{formatTimeShort((percent / 100) * duration)}</span>
                            <span className="opacity-60">/</span>
                            <span>{formatTimeShort(duration)}</span>
                        </div>
                    </div>


                    <div className="flex items-center gap-4">

                        {/* Âm lượng */}
                        <Volume videoRef={videoRef} />

                        {/* settings */}
                        <VideoSettings
                            videoRef={videoRef}
                            containerRef={containerRef}
                            availableLanguages={availableLanguages}
                            qualities={qualities}
                            currentQuality={currentQuality}
                            onQualityChange={onQualityChange}
                        />

                        {/* full screen */}
                        <button onClick={toggleFullscreen} className="hover:text-white transition-colors">
                            <LuMaximize size={20} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Volume = ({ videoRef }) => {
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        const nextMute = !isMuted;
        videoRef.current.muted = nextMute;
        setIsMuted(nextMute);
    };

    const handleVolumeChange = (newVolume) => {
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        if (newVolume > 0) {
            videoRef.current.muted = false;
            setIsMuted(false);
        }
    };

    return (
        <div className="flex items-center gap-2 group/volume cursor-pointer">
            <button onClick={toggleMute} className='cursor-pointer'>
                {isMuted || volume === 0 ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{
                    background: `linear-gradient(
                                    to right,
                                    #098be4 0%,              
                                    #098be4 ${(isMuted ? 0 : volume) * 100}%,
                                    #e5e7eb ${(isMuted ? 0 : volume) * 100}%,
                                    #e5e7eb 100%
                                )`,
                }}
                className="volume-slider"
            />
        </div>
    );
}


const CompactControls = ({ videoRef, isPlaying, toggleFullscreen, containerRef, percent, duration, availableLanguages }) => {

    return (
        <div className="flex items-center justify-between text-gray-300 mb-2 px-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()}
                    className="hover:text-white text-gray-300 transition-colors cursor-pointer"
                >
                    {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
                </button>

                <div className="flex items-center text-xs gap-1 ml-2 hover:text-white cursor-default">
                    <span>{formatTimeShort((percent / 100) * duration)}</span>
                    <span className="opacity-60">/</span>
                    <span>{formatTimeShort(duration)}</span>
                </div>

                {/* Âm lượng */}
                <Volume videoRef={videoRef} />
            </div>

            <div className="flex items-center gap-4">
                <VideoSettings
                    videoRef={videoRef}
                    containerRef={containerRef}
                    availableLanguages={availableLanguages}
                />

                <button
                    onClick={toggleFullscreen}
                    className="hover:text-white transition-colors cursor-pointer"
                >
                    <LuMaximize size={20} />
                </button>
            </div>
        </div>
    );
};


export default VideoControls;