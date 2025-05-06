import { Router } from "express";
import {registerUser, logOutUser, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar} from "../controllers/userControllers.js"
import {verifyJWT} from "../middlewares/verifyJWT.middlewares.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router()

//unsecured routes
// /api/v1/healthCheck/test
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            count: 1
        },
        {
            name: "coverImage",
            count: 1 
        } 
    ]),
    registerUser)


router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

//Secured routes
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("history").get(verifyJWT, getWatchHistory)

//how to get from params/url
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)


router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router
//routes for user avatar and cover image
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)


export default router