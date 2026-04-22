import React, { useRef } from "react";
import VideoPlayer from "@/components/student/course-detail/VideoPlayer";


const PromoVideoPlayer = ({
    videoUrl,
    captions = [],
    poster,
    startTime = 0,
}) => {
    const playerRef = useRef(null);

    if (!videoUrl) return null;

    return (
        <div className="w-full flex justify-center bg-black">
            <div className="w-full mx-auto">
                <VideoPlayer
                    ref={playerRef}
                    videoUrl={videoUrl}
                    startTime={startTime}
                    captions={captions}
                    poster={poster}
                    className={``}
                />
            </div>
        </div>
    );
};

export default PromoVideoPlayer;