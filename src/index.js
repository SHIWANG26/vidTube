import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

// IF .env is inside src/:
dotenv.config({ path: "./.env" });

// IF .env is outside src/:
// dotenv.config({ path: "../.env" });

const PORT = process.env.PORT || 3000;

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at ${PORT}`);
    })
})
.catch((error) => {
    console.log("MongoDB connection error", error);
})
