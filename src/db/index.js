import mongoose from "mongoose";
import {DB_NAME} from "../constants.js";

// This function connects to the MongoDB database using Mongoose.
const connectDB = async() => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDB connected! DB_HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MongoDB connection error", error)
        process.exit(1)
    }
}

// This function is exported to be used in other parts of the application to establish a connection to the database.
export default connectDB;