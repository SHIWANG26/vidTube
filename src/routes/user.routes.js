import { Router } from "express";
import {registerUser} from "../controllers/userControllers.js"

import {upload} from "../middlewares/multer.middlewares.js"

const router = Router()

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

export default router