import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/spd";

export default async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI, {
      // options are generally optional with mongoose 7+
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  }
}
