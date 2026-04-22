import React, { useEffect, useRef, forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import Hls from 'hls.js';

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

const VideoPlayer = forwardRef(({ videoUrl, onPlayStateChange, startTime = 0, captions = [] }, ref) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const hlsRef = useRef(null);
    const hasSetStartTime = useRef(false);
    const hasSeekedOnce = useRef(false);
    const [isPlaying, setIsPlaying] = useState(false);


    const isYouTube = useMemo(() =>
        videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be"),
        [videoUrl]
    );
    useImperativeHandle(ref, () => ({
        getCurrentTime: () => playerRef.current?.currentTime || 0,
        getDuration: () => playerRef.current?.duration || 0,
        play: () => playerRef.current?.play(),
        pause: () => playerRef.current?.pause(),
        setCurrentTime: (time) => { if (playerRef.current) playerRef.current.currentTime = time; }
    }));

    useEffect(() => {
        if (!videoRef.current || !videoUrl || isYouTube) return;
        const video = videoRef.current;

        Array.from(video.querySelectorAll('track')).forEach(track => track.remove());
        if (captions && captions.length > 0) {
            captions.forEach(track => {
                const el = document.createElement('track');
                el.kind = 'subtitles';
                el.label = LANGUAGE_MAP[track.language] || track.language;
                el.srclang = track.language;
                el.src = track.publicURL;
                if (track.language === "vi") el.default = true;
                video.appendChild(el);
            });
        }

        const initPlayer = (hlsInstance) => {
            if (playerRef.current) return;

            let qualityOptions = ['0'];
            if (hlsInstance && hlsInstance.levels) {
                const heights = hlsInstance.levels.map(l => String(l.height)); 
                const unique = [...new Set(heights)].sort((a, b) => Number(b) - Number(a)); 
                qualityOptions = ['0', ...unique];
            }

            const player = new Plyr(video, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'fullscreen'],
                settings: ['quality', 'speed', 'captions'],
                i18n: {
                    qualityLabel: 'Quality',
                    qualityBadge: {
                        '2160': '4K',
                        '1440': 'HD',
                        '1080': 'HD',
                        '720': 'HD',
                        '576': 'SD',
                        '480': 'SD',
                        '0': 'Auto',
                    },
                },
                quality: {
                    default: '0',
                    options: qualityOptions,
                    forced: true,
                    onChange: (newQuality) => {
                        console.log("Changing quality to:", newQuality);

                        if (!hlsInstance) return;

                        if (newQuality === '0') {
                            hlsInstance.currentLevel = -1;
                            return;
                        }

                        const levelIndex = hlsInstance.levels.findIndex(
                            l => String(l.height) === newQuality
                        );

                        if (levelIndex !== -1) {
                            hlsInstance.currentLevel = levelIndex;
                        }
                    }
                }
            });
            playerRef.current = player;

            if (!hasSetStartTime.current && startTime) {
                const setTime = () => video.currentTime = startTime;
                if (video.duration) setTime();
                else video.addEventListener('loadedmetadata', setTime, { once: true });
                hasSetStartTime.current = true;
            }

            player.on('play', () => { setIsPlaying(true); onPlayStateChange?.(true); });
            player.on('pause', () => { setIsPlaying(false); onPlayStateChange?.(false); });
            player.on('ended', () => { setIsPlaying(false); onPlayStateChange?.(false); });
            player.on('seeked', () => {
                if (!hasSeekedOnce.current) {
                    hasSeekedOnce.current = true;
                    return;
                }
                // if (!player.playing) {
                //     console.log(player.playing)
                //     player.play();
                // }
            });
        };

        if (videoUrl.endsWith('.m3u8') && Hls.isSupported()) {
            const hls = new Hls({
                maxBufferLength: 12,       // Buffer ngắn = chuyển đổi nhanh hơn
                maxMaxBufferLength: 15,
                abrEwmaFastLive: 2.0,
            });
            hlsRef.current = hls;
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            // hls.on(Hls.Events.MANIFEST_PARSED, () => {
            //     video.addEventListener("loadedmetadata", initPlayer, { once: true });
            // });
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                initPlayer(hls);
            });
        } else {
            video.src = videoUrl;
            video.addEventListener("loadedmetadata", () => initPlayer(null), { once: true });
        }
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoUrl, isYouTube, startTime, onPlayStateChange]);

    // useEffect(() => {
    //     if (!playerRef.current) return;
    //     const interval = setInterval(() => {
    //         const currentTime = playerRef.current.currentTime || 0;
    //         const lastTime = lastTimeRef.current;
    //         const isSeek = Math.abs(currentTime - lastTime) > 0.5;
    //         if (!isPlaying && isSeek) {
    //             playerRef.current.play();
    //         }
    //         lastTimeRef.current = currentTime;
    //     }, 200);
    //     return () => clearInterval(interval);
    // }, [isPlaying]);

    if (isYouTube) {
        const videoId = videoUrl.split("v=")[1]?.split("&")[0] || videoUrl.split("/").pop();
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
        return (
            <div className="w-full h-[45vh] md:h-[50vh] lg:h-[58vh] flex justify-center">
                <iframe
                    width="100%"
                    height="100%"
                    src={embedUrl}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div className="w-full bg-black h-[45vh] md:h-[50vh] lg:h-[60vh] flex justify-center items-center">
            <div className="aspect-video w-auto max-h-full">
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    playsInline
                />
            </div>
        </div>
    );
});

export default VideoPlayer;