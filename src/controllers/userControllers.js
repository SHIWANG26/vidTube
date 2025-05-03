import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"


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
        throw new Apirror(400, "Email is required");
        
    }
})

export
{
    registerUser
}