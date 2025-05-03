//to save file on the cloud from server
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { log } from "console";

dotenv.config()

//cloudinary config
cloudinary.config({    
cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
api_key:process.env.CLOUDINARY_API_KEY,
api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log("cloudinary config", {    
        //     cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        //     api_key:process.env.CLOUDINARY_API_KEY,
        //     api_secret:process.env.CLOUDINARY_API_SECRET
        //     });

        if (!localFilePath) {
            return null;
        }        
        const response = await cloudinary.uploader.upload(localFilePath,
            {resource_type: "auto"}
        )
        console.log("File uploaded on cloudinary. File src:" + response.url);
        //once the file is uploaded on the cloud we would like to delete it from the server
        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        console.log("Error on cloudinary", error);
        
        fs.unlinkSync(localFilePath)
        return null
    }
};

//Delete from cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        console.log("Deleted from cloudinary. Public Id: ", publicId);
        
    } catch (error) {
        console.log("Error in deleting from cloudinary", error);
        return null;
    }
}

export {
    uploadOnCloudinary, deleteFromCloudinary
}