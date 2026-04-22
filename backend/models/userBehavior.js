import mongoose from "mongoose";

const BehaviorSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        ordered: [
            {
                _id: false,
                course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true},
                orderedAt: { type: Date, default: Date.now },
                price: Number,
            },
        ],
        viewed: [
            {
                _id: false,
                course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true},
                count: { type: Number, default: 1 },
                lastView: { type: Date, default: Date.now },
            },
        ],
        searched: [
            {
                keyword: String,
                normalized: String, // lowercase, bỏ dấu
                count: { type: Number, default: 1 },
                lastSearch: { type: Date, default: Date.now },
            },
        ],
        lastCalculated: Date,
        calculating: { type: Boolean, default: false}
    },
    { timestamps: true }
);
BehaviorSchema.index({ user: 1 });
const UserBehavior = mongoose.model("UserBehavior", BehaviorSchema);
export default UserBehavior;
