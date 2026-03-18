import mongoose from "mongoose";
import config from './config.js'
async function connectDB() {
    await mongoose.connect(config.MONGODB_URI)
    .then(()=>{
        console.log("Successfully connected to db");
    })
    .catch((err)=>{
        console.log('error connecting db',err);
    })
}
export default connectDB;