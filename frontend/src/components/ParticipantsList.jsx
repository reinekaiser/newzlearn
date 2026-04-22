
import { Users, Video, VideoOff, Mic, MicOff } from "lucide-react";

const ParticipantsList = ({ participants }) => {
    return (
        <div className="w-full bg-gray-800 p-4 flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users size={20} />
                Người tham gia ({participants.length})
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2">
                {participants.map((p) => (
                    <div key={p.socketId} className="bg-gray-700 p-3 rounded flex items-baseline justify-between">
                        <div className="font-medium">{p.userName}</div>
                        <div className="flex gap-2 mt-2">
                            {p.video ? (
                                <Video size={16} className="text-green-400" />
                            ) : (
                                <VideoOff size={16} className="text-red-400" />
                            )}
                            {p.audio ? (
                                <Mic size={16} className="text-green-400" />
                            ) : (
                                <MicOff size={16} className="text-red-400" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ParticipantsList;
