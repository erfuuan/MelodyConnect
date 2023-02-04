import mongoose  from "mongoose";
import moment from "jalali-moment";
const postSaveSchema = new mongoose.Schema({
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    postId: { type: mongoose.Types.ObjectId, ref: 'Post', required: true },
    updatedAt: Number,
    deletedAt: Number,
    softDelete: { type: Boolean, default: false }
},
    {
        timestamps: {
            createdAt: "createdAt",
            updatedAt: "updatedAt"
        },
        versionKey: false
    }
);
const postSave = mongoose.model('postSave', postSaveSchema);
export  {postSave}