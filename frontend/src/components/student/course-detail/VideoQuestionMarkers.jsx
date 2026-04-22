import React, { useMemo } from 'react';

// [{ id, time, type }]
const VideoQuestionMarkers = ({ markers = [], duration = 0, onMarkerClick }) => {

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
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {validMarkers.map((marker) => (
                <div
                    key={marker.id}
                    className="group absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer pointer-events-auto z-30"
                    style={{ left: `${marker.position}%` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMarkerClick && onMarkerClick(marker);
                    }}
                >
                    <div className={`
                        w-2.5 h-2 transition-transform duration-200
                        ${marker.type === 'question' ? 'bg-blue-700' : ''}
                    `} />

                    {/* <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
                        {marker.type === 'question' ? 'Câu hỏi: ' : ''} {formatTime(marker.time + 0.00001)}
                    </div> */}
                </div>
            ))}
        </div>
    );
};

export default VideoQuestionMarkers;

// <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
//     {validMarkers.map((marker) => (
//         <div
//             key={marker.id}
//             className="group absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer pointer-events-auto z-30 hover:z-50"
//             style={{ left: `${marker.position}%` }}
//             onClick={(e) => {
//                 e.stopPropagation();
//                 onMarkerClick && onMarkerClick(marker);
//             }}
//         >
//             <div className={`
//                         w-2.5 h-2.5 transition-transform duration-200 group-hover:scale-125
//                         ${marker.type === 'question' ? 'bg-blue-700' : 'bg-yellow-400'}
//                     `} />

//             <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-30">
//                 {marker.type === 'question' ? 'Câu hỏi: ' : ''} {formatTime(marker.time + 0.00001)}
//             </div>
//         </div>
//     ))}
// </div>