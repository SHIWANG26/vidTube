import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle subscription for a user
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user?._id,
        channel: channelId,
    });

    if (existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id);

        return res.status(200).json(
            new ApiResponse(
                200,
                { subscribed: false },
                "Unsubscribed successfully"
            )
        );
    }

    await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            { subscribed: true },
            "Subscribed successfully"
        )
    );
});

// Get list of subscribers for a specific channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const channelObjectId = new mongoose.Types.ObjectId(channelId);

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: channelObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribedToSubscriber",
                        },
                    },
                    {
                        $addFields: {
                            subscribedToSubscriber: {
                                $cond: {
                                    if: {
                                        $in: [channelObjectId, "$subscribedToSubscriber.subscriber"],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                            subscribersCount: {
                                $size: "$subscribedToSubscriber",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscriber",
        },
        {
            $project: {
                _id: 0,
                subscriber: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    subscribedToSubscriber: 1,
                    subscribersCount: 1,
                },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

// Get list of channels a user is subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    const subscriberObjectId = new mongoose.Types.ObjectId(subscriberId);

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberObjectId,
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: "owner",
                            as: "videos",
                        },
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos",
                            },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$subscribedChannel",
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1,
                    },
                },
            },
        },
    ]);

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Subscribed channels fetched successfully")
    );
});

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
