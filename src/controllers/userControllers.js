import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { JsonWebTokenError } from "jsonwebtoken"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(501, "User not found");
        }
        const accessToken = user.genarateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken
        await user.save({ValidateBeforeSave : false})
        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
        
    }
}

const registerUser = asyncHandler(async(req, res) => {
    const {fullName, email, username, password} = req.body

    //validation
    if
    (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    )
    {
        throw new ApiError(400, "All fields are required");
    }

    //find whether a user is present or not
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if (existedUser) {
        throw new ApiErrorError(409, "User with username or email already exists");
        
    }
    //how to handle images
    console.warn(req.files)
    //inject files in request object using multer
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverLocalPath = req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    //Send the image on cloudinary
    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverLocalPath)
    // }

    //Refactoring of above code
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Avatar uploaded!", avatar);
        
    } catch (error) {
        console.log("Error uploading avatar", error);
        throw new ApiError(500, "Failed to upload avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log("CoverImage uploaded!", coverImage);
        
    } catch (error) {
        console.log("Error uploading coverImage", error);
        throw new ApiError(500, "Failed to upload coverImage")
    }

    //create user
    try {
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email, 
            password,
            username: username.toLowerCase()
        })
    
        //check whether user is created or not 
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        if (!createdUser) {
            throw new ApiError(500, "SOmething went wrong while registering user");
        }
        return res
            .status(201)
            .json(new ApiResponse(201, createdUser, "User registered successfully"))
    } catch (error) {
        console.log("User creation failed");
        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }
        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new ApiError(500, "SOmething went wrong while registering user and images were deleted");

    }
})

//create route for login
const loginUser = asyncHandler(async(req,res) => {
    //get data from body
    const {email, username, password} = req.body;
    //validation
    if (!email) {
        throw new ApiError(400, "Email is required");
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    //validate password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    //we will take help from helper functions to generate access tokens
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    //We will firebase a user from dB
    const loggedInUser = await user.findById(user._id)
                            .select("-password -refreshToken");
    if (!loggedInUser) {
        throw new ApiError(404, "User not found");
    }
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV ===  "production",
    }
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        // .json(new ApiResponse(200, loggedInUser, "User loggedIn successfully"))
        //mobile app do not use cookie so we will use another format
        .json(new ApiResponse(
            200,
            {user, loggedInUser, accessToken, refreshToken},
            "User loggedIn successfully"
        ))
})
//logout user
const logOutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            //set new field refreshToken to null
            $set: {
                refreshToken: undefined
            }
        },
        {new: true}
    )
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))

})
//how to generate refreshAccessToken
const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Refresh token is missing, please login again")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, "Invalid refresh token, please login again")
        }
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token, please login again")
        }
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
        }
        const {accessToken, refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200, 
                {
                    accessToken, refreshToken: newRefreshToken
                }, 
                "Access token refreshed successfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while refreshing access token")
    }
})
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordValid) {
        throw new ApiError(401, "Old password is incorrect")
    }
    user.password = newPassword

    //save the user
    await user.save({ValidateBeforeSave: false})

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})
const getCurrentUser = asyncHandler(async(req, res) => {
    //user is already present in req.user
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User fetched successfully"))
})
const updateAccountDetails = asyncHandler(async(req, res) => {
    //what fields we need to update
    const {fullName, email} = req.body
    
    //validation
    if (!fullName || !email) {
        throw new ApiError(400, "Full name and email are required")
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    //send response
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User accounts details updated successfully"))
})
const updateUserAvatar = asyncHandler(async(req, res) => {
    //access the file from request object
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
    //upload the image on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(500, "Failed to upload avatar")
    }
    const user  = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
        .status(200
        .json(new ApiResponse(200, user, "User avatar updated successfully"))
        )
})
const updateUserCoverImage = asyncHandler(async(req, res) => {
    //access the file from request object(coverImage)
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    //upload the image on cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    //validate the image
    if (!coverImage) {
        throw new ApiError(500, "Failed to upload cover image")
    }
    const user = await User.findByIdAndUpdate(
        req._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    //send response
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User cover image updated successfully"))
})

//now we will write two more controllers which will use aggregation pipeline to get the user details and followers and following
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params
    if (!username.trim()){
        throw new ApiError(400, "Username is required")
    }
    //now we will use aggregation pipeline to get the user details and followers and following. in this we will pass array and in that we will pass the username and then we will pass multiple objects
    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
                },
                $lookup: {
                    from : "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
                },
                $addFields: {
                    subscribersCount: {//we use dollar to named variables inside the "addFields"
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount: {
                        $size: "$subscribedTo"
                    },
                    isSubscribed: {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then: true,
                            else: false
                        }
                    }
                },
                //project is used to select the fields we want to return
                $project: {
                    //we use 0 to exclude the fields we dont want to return
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelsSubscribedToCount: 1,
                    isSubscribed: 1,
                    email: 1,
                }
                
            }
        ]
    )
    //after this an array of objects will be returned and we will get the first object from it
    if (!channel.length) {
        throw new ApiError(404, "Channel not found")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
})
const getWatchHistory = asyncHandler(async(req, res) => {
    //we will use aggregation pipeline to get the user details and followers and following. in this we will pass array and in that we will pass the username and then we will pass multiple objects
    const user = await User.aggregate(
        [
            {
                $match: {
                    //mongoose.Types.ObjectId is used to convert the string to object id
                    //new is not used since mongoose automatically creates a new object id
                    _id: mongoose.Types.ObjectId(req.user?._id)
                },
                $lookup: {
                    from: "videos",
                    localField: "watchHistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline:[
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: {
                                    $first: "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )
    return res
        .status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
})

export
{
    registerUser, 
    loginUser, 
    refreshAccessToken, 
    logOutUser, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage
}