import mongoose, {Schema} from "mongoose"

//It helps to create model for playlist
const playlistSchema = new Schema({
    name: {
        type:String,
        required: true
    },
    description: {
        type:String, 
        required: true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video"
    }],
    owner: {
        type: Schema.ObjectId,
        ref: "User"
    }
},
{timestamps : true}
)

export const PLaylist = mongoose.model("Playlist", playlistSchema)