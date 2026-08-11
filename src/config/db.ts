import mongoose from "mongoose";
import { env } from "./env.js";

const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(
            env.MONGO_URI as string
        );

        console.log("Successfully connected to MongoDB")
    } catch (error: any) {
        console.log(`Error connecting to MongoDB`, error.message);
        process.exit();
    }
}


export default connectDB;