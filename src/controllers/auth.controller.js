import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import crypto from "crypto";
import { access } from "fs";

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

  const refreshToken = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.create({
    userId: user._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = jwt.sign(
    { userId: user._id, sessionId: session._id },
    config.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in milliseconds
  });

  res.status(201).json({
    message: "User Registered successfully",
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
}

export async function loginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel
    .findOne({
      email,
    })
    .select("+password");
  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const refreshToken = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });
  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.create({
    userId: user._id,
    refreshTokenHash,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  const accessToken = jwt.sign(
    { userId: user._id, sessionId: session._id },
    config.JWT_SECRET,
    { expiresIn: "10m" },
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in milliseconds
  });

  res.status(200).json({
    message: "Login successfully",
    user: {
      username: user.username,
      email: user.email,
    },
    accessToken,
  });
}

export async function getMe(req, res) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(404).json({
      message: "Token not found",
    });
  }

  try {
    const decode = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decode.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.status(200).json({
      message: "Successfully get the user",
      user,
    });
  } catch (err) {
    console.log("error in the token", err);
    return res.status(401).json({
      message: "Invalid token",
    });
  }
}

export async function refreshToken(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({
      message: "Token not found please login again",
    });
  }

  try {
    const decode = jwt.verify(refreshToken, config.JWT_SECRET);
    const user = await userModel.findById(decode.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await sessionModel.findOne({
      refreshTokenHash,
      isRevoked: false,
    });

    if (!session) {
      return res.status(400).json({
        message: "Invalid refresh token",
      });
    }

    const newRefreshToken = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });

    const accessToken = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: "15m",
    });

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, //7 days in milliseconds
    });

    res.status(200).json({
      message: "Access token generated successfully",
      accessToken,
    });
  } catch (err) {
    res.status(404).json({
      message: "Error in the Token please login again",
    });
  }
}

export async function logoutController(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({
      message: "Refresh token not found",
    });
  }

  const refreshTokenHash = crypto
    .createHash("sha256")
    .update(refreshToken)
    .digest("hex");

  const session = await sessionModel.findOne({
    refreshTokenHash,
    isRevoked: false,
  });

  if (!session) {
    return res.status(400).json({
      message: "Invalid refresh token",
    });
  }

  session.isRevoked = true;
  await session.save();

  res.clearCookie("refreshToken");

  res.status(200).json({
    message: "Logged out successfully",
  });
}

export async function logoutAllController(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(404).json({
      message: "Refresh Token not found",
    });
  }

  try {
    const decode = jwt.verify(refreshToken, config.JWT_SECRET);

    await sessionModel.updateMany(
      {
        userId: decode.userId,
        isRevoked: false,
      },
      {
        isRevoked: true,
      },
    );

    res.clearCookie("refreshToken");

    res.status(200).json({
      message: "Logout from all devices successfully",
    });
  } catch (err) {
    res.status(404).json({
      message: "Invalid token",
    });
  }
}
