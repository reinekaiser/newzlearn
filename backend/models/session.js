import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },
        sessionName: {
            type: String,
            required: true,
            trim: true,
        },
        sessionDescription: {
            type: String,
        },
        scheduledStart: {
            type: Date,
            required: true,
        },
        scheduledEnd: {
            type: Date,
            required: true,
        },
        actualStart: {
            type: Date,
        },
        actualEnd: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["scheduled", "live", "ended", "cancelled"],
            default: "scheduled",
        },
        participants: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                joinedAt: Date,
                leftAt: Date,
                duration: Number, // seconds
            },
        ],
        chatHistory: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                },
                userName: String,
                message: String,
                timestamp: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Generate unique session code
sessionSchema.statics.generateSessionCode = async function () {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code;
    let exists = true;

    while (exists) {
        code = "S-";
        for (let i = 0; i < 8; i++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        exists = await this.findOne({ sessionCode: code });
    }

    return code;
};

// Check if session is currently live
sessionSchema.methods.isLive = function () {
    return this.status === "live";
};

// Calculate total participants
sessionSchema.methods.getTotalParticipants = function () {
    return this.participants.length;
};

const Session = mongoose.model("Session", sessionSchema);
export default Session;
