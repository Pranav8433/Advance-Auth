import userModel from "../models/user.model.js";
import jwt, { decode } from "jsonwebtoken";
import config from "../config/config.js";

export async function registerController(req, res) {
  const { username, email, password } = req.body;

  const isUserExist = await userModel.findOne({
    $or: [{ username }, { email }],
  });

  if (isUserExist) {
    return res.status(409).json({
      message: "User can not register with this username or email",
    });
  }

  const user = await userModel.create({
    username,
    email,
    password,
  });

  const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
    expiresIn: "1d",
  });
  res.cookie("token", token);

  res.status(201).json({
    message: "User Registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    token,
  });
}

export async function getMe(req, res) {
  const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;

  try {
    const decode = jwt.verify(token, config.JWT_SECRET);
    console.log(decode);
    const user = await userModel.findById(decode.userId);
    res.status(200).json({
        message:"Successfully get the user",
        user
    })
  } catch (err) {
    console.log("error in the token", err);
  }
}
