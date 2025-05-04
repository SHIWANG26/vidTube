import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
    const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    // Check if token is provided
    if (!token) {
        return next(new ApiError(401, "Unauthorized! No token provided."));
    }
    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        // Check if user exists
        if(!user){
            throw new ApiError(401, "Unauthorized! User not found.")
        }
        req.user = user

        //transfer control from middleware to user controller
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized! Invalid token.")
    }
})