import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Hls from 'hls.js';
import VideoControls from '@/components/student/course-detail/VideoControls';
import CenterPlayButton from '@/components/student/course-detail/CenterPlayButton';

const LANGUAGE_MAP = {
    en: "English",
    vi: "Vietnamese",
    fr: "French",
    ja: "Japanese",
    ko: "Korean",
    zh: "Chinese",
    es: "Spanish",
    de: "German",
};

const VideoPlayer = forwardRef(({
    className = "", videoHeight = "",
    videoUrl = "",
    onTimeUpdate, onPlayStateChange, startTime = 0, captions = [], poster,
    questionMarkers, noteMarkers, onReady,
    children
}, ref) => {

    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const containerRef = useRef(null);
    const hideTimerRef = useRef(null);

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [buffered, setBuffered] = useState(0);
    const [showControls, setShowControls] = useState(false);
    const [availableLanguages, setAvailableLanguages] = useState([]);
    const [qualities, setQualities] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1);
    const [isMetadataLoaded, setIsMetadataLoaded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);


    useImperativeHandle(ref, () => ({
        play: () => videoRef.current?.play(),
        pause: () => videoRef.current?.pause(),
        getCurrentTime: () => videoRef.current?.currentTime || 0,
        getDuration: () => videoRef.current?.duration || 0,
        setCurrentTime: (time) => {
            if (videoRef.current)
                videoRef.current.currentTime = time;
        }
    }));

    const handleTimeUpdate = () => {
        if (videoRef.current && onTimeUpdate) {
            onTimeUpdate(videoRef.current.currentTime);
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !videoUrl) return;

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        if (videoUrl.endsWith(".m3u8") && Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 12,
                maxMaxBufferLength: 15,
                abrEwmaFastLive: 2.0,
                enableWorker: true,
                lowLatencyMode: true,
            });

            hlsRef.current = hls;
            hls.loadSource(videoUrl);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                const levels = hls.levels.map((level, index) => ({
                    index: index,
                    height: level.height,
                    bitrate: level.bitrate
                })).sort((a, b) => b.height - a.height);

                setQualities(levels);

                if (startTime > 0) {
                    video.currentTime = startTime;
                }
            });
        } else {
            video.src = videoUrl;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoUrl]);

    //caption
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        Array.from(video.querySelectorAll('track')).forEach(track => track.remove());
        if (captions && captions.length > 0) {
            const langs = captions.map(c => ({
                label: LANGUAGE_MAP[c.language] || c.language,
                srclang: c.language
            }));
            setAvailableLanguages(langs);
        }
        captions.forEach(track => {
            const el = document.createElement('track');
            el.kind = 'subtitles';
            el.label = LANGUAGE_MAP[track.language] || track.language;
            el.srclang = track.language;
            el.src = track.publicURL;
            if (track.language === "vi") el.default = false;
            video.appendChild(el);
        });

    }, [captions, videoUrl]);

    // set starttime
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        if (startTime > 0 && !isNaN(video.duration)) {
            video.currentTime = startTime;
        }
    }, [startTime]);

    //lắng nghe trạng thái
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const onLoadedMetadata = () => {
            setDuration(video.duration);
            setIsMetadataLoaded(true);
        };

        const onCanPlay = () => {
            if (onReady) {
                onReady({
                    duration: video.duration,
                    readyState: video.readyState
                });
            }
        };

        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const onPlay = () => {
            setIsPlaying(true);
            onPlayStateChange?.(true);
        };

        const onPause = () => {
            setIsPlaying(false);
            onPlayStateChange?.(false);
        };

        const onEnded = () => {
            setIsPlaying(false);
            onPlayStateChange?.(false);
        };

        const handleProgress = () => {
            if (video.duration > 0 && video.buffered.length > 0) {
                const lastBuffer = video.buffered.end(video.buffered.length - 1);
                setBuffered((lastBuffer / video.duration) * 100);
            }
        };

        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("canplay", onCanPlay);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("ended", onEnded);
        video.addEventListener("progress", handleProgress);

        return () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("ended", onEnded);
            video.removeEventListener("progress", handleProgress);
        };
    }, [onPlayStateChange, onReady]);

    //tua bằng phím
    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeEl = document.activeElement;
            const tagName = activeEl?.tagName.toUpperCase();

            const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
            const isContentEditable = activeEl?.isContentEditable || activeEl?.getAttribute("contenteditable") === "true";

            if (isInput || isContentEditable) return;

            const video = videoRef.current;
            if (!video) return;

            switch (e.key) {
                case "ArrowRight":
                    e.preventDefault();
                    video.currentTime = Math.min(video.currentTime + 5, video.duration);
                    handleMouseMove();
                    break;
                case "ArrowLeft":
                    e.preventDefault();
                    video.currentTime = Math.max(video.currentTime - 5, 0);
                    handleMouseMove();
                    break;
                case " ":
                    e.preventDefault();
                    handleTogglePlay();
                    handleMouseMove();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [duration]);

    // fullscreen 
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!(document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement);
            setIsFullscreen(isFs);
        };
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
            .forEach(event => document.addEventListener(event, handleFullscreenChange));

        return () => {
            ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange']
                .forEach(event => document.removeEventListener(event, handleFullscreenChange));
        };
    }, []);

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;

        try {
            const isFs = document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement;

            if (!isFs) {
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if (containerRef.current.webkitRequestFullscreen) {
                    await containerRef.current.webkitRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                }
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
        }
    };

    const handleMouseMove = (e) => {
        e.stopPropagation()
        setShowControls(true);

        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }

        hideTimerRef.current = setTimeout(() => {
            // if (isPlaying) {
            //     setShowControls(false);
            // }
            setShowControls(false);
        }, 2500);
    };

    const handleTogglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    const handleQualityChange = (levelIndex) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex;
            setCurrentQuality(levelIndex);
        }
    };

    return (
        <div
            ref={containerRef}
            className={`
                bg-black group select-none
                ${showControls ? 'cursor-default' : 'cursor-none'}
                ${className}
                ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen flex items-center justify-center' : 'relative w-full mx-auto'}
            `}
            onMouseMove={handleMouseMove}
        >
            <div className={`w-full h-full flex items-center justify-center`}>
                <div
                    className={`
                        bg-black flex items-center justify-center select-none
                        ${isFullscreen ? "w-full h-full enter-fullscreen" : `w-full ${videoHeight} aspect-video relative`}
                    `}
                >
                    <Poster
                        poster={poster}
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                    />

                    <video
                        ref={videoRef}
                        className="w-full h-full select-none"
                        style={{ objectFit: isFullscreen ? 'contain' : 'cover' }}
                        playsInline
                        poster={poster}
                        onClick={handleTogglePlay}
                        onTimeUpdate={handleTimeUpdate}
                        onContextMenu={(e) => e.preventDefault()}
                    />

                    <div className="absolute inset-0 z-70 w-full h-full pointer-events-none cursor-auto">
                        {children}
                    </div>

                    <CenterPlayButton
                        visible={!isPlaying}
                        onClick={handleTogglePlay}
                    />

                    <VideoControls
                        className={`
                            absolute left-0 right-0 bottom-0 py-4
                            bg-linear-to-t from-black/80 via-black/40 to-transparent
                            transition-opacity duration-300 z-40 select-none
                            ${showControls ? 'opacity-100' : 'opacity-0'}
                        `}
                        containerRef={containerRef}
                        buffered={buffered}
                        duration={duration}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        videoRef={videoRef}
                        toggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                        handleTogglePlay={handleTogglePlay}
                        availableLanguages={availableLanguages}
                        qualities={qualities}
                        currentQuality={currentQuality}
                        onQualityChange={handleQualityChange}
                        questionMarkers={questionMarkers}
                        noteMarkers={noteMarkers}
                    />
                </div>
            </div>
        </div>
    )
})

const Poster = ({ poster, isPlaying, currentTime }) => {
    return (
        <>
            {poster && !isPlaying && currentTime === 0 && (
                <div className="absolute inset-0 pointer-events-none z-10 select-none">
                    <img
                        src={poster}
                        alt="Video Poster"
                        className="w-full h-full object-cover transition-opacity duration-500"
                    />
                </div>
            )}
        </>
    );
}

export default VideoPlayer;