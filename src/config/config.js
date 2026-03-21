import dotenv from "dotenv";
dotenv.config();

const required = ["MONGODB_URI", "ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is not defined in environment variables`);
  }
}

const config = {
  MONGODB_URI: process.env.MONGODB_URI,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
};

export default config;