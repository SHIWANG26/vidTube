import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleLike = asyncHandler(async (req, res, type) => {
    const itemId = req.params[`${type}Id`];

    if (!isValidObjectId(itemId)) {
        throw new ApiError(400, `Invalid ${type}Id`);
    }

    const filter = {
        [type]: itemId,
        likedBy: req.user._id,
    };

    const existingLike = await Like.findOne(filter);

    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, {}, `${type} unliked successfully`));
    }

    const newLike = await Like.create(filter);

    return res.status(200).json(new ApiResponse(200, newLike, `${type} liked successfully`));
});

const toggleVideoLike = asyncHandler(async (req, res) => {
    return toggleLike(req, res, "video");
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    return toggleLike(req, res, "comment");
});

const toggleTweetLike = asyncHandler(async (req, res) => {
    return toggleLike(req, res, "tweet");
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true } })
        .populate("video");

    const likedVideos = likes.map((like) => like.video);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
};
