import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { createTokenPair, setRefreshCookie } from "../helpers/auth.helper.js";
import { sendEmail } from "../service/email.service.js";
import { generateOTP, getOtpHtml } from "../helpers/otp.helper.js";
import otpModel from "../models/otp.model.js";

export async function registerController(req, res) {
  try {
    const { username, email, password } = req.body;

    const isUserExist = await userModel.findOne({
      $or: [{ username }, { email }],
    });

    if (isUserExist) {
      return res.status(409).json({
        message: "User cannot register with this username or email",
      });
    }
    const user = await userModel.create({ username, email, password });

    const otp = generateOTP();
    const html = getOtpHtml(otp);

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    await otpModel.create({
      email,
      user: user._id,
      otpHash: otpHash,
    });

    await sendEmail(
      email,
      "Your OTP Code for Email Verification",
      `Your OTP code is: ${otp}`,
      html,
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        verified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("registerController error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    console.log(email, password);

    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in" });
    }

    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const { refreshToken, accessToken } = await createTokenPair(user, req);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      message: "Login successful",
      user: {
        username: user.username,
        email: user.email,
      },
      accessToken,
    });
  } catch (err) {
    console.error("loginController error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// req.user is already set by authenticate middleware
export function getMe(req, res) {
  return res.status(200).json({
    message: "User fetched successfully",
    user: req.user,
  });
}

export async function refreshTokenController(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ message: "Token not found, please log in again" });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);

    const user = await userModel.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      return res.status(400).json({ message: "Invalid refresh token" });
    }

    // Rotate refresh token
    const newRefreshToken = jwt.sign(
      { userId: user._id },
      config.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    // Include sessionId in access token (bug fix)
    const accessToken = jwt.sign(
      { userId: user._id, sessionId: session._id },
      config.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" },
    );

    const newRefreshTokenHash = crypto
      .createHash("sha256")
      .update(newRefreshToken)
      .digest("hex");

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    setRefreshCookie(res, newRefreshToken);

    return res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken,
    });
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Invalid token, please log in again" });
  }
}

export async function logoutController(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token not found" });
  }

  // Verify before hitting the DB
  try {
    jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);
  } catch {
    res.clearCookie("refreshToken");
    return res.status(401).json({ message: "Invalid or expired token" });
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
    return res
      .status(400)
      .json({ message: "Session not found or already revoked" });
  }

  session.isRevoked = true;
  await session.save();
  res.clearCookie("refreshToken");

  return res.status(200).json({ message: "Logged out successfully" });
}

export async function logoutAllController(req, res) {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET);

    await sessionModel.updateMany(
      { userId: decoded.userId, isRevoked: false },
      { isRevoked: true },
    );

    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json({ message: "Logged out from all devices successfully" });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export async function verifyEmailController(req, res) {
    const { otp, email } = req.body

    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const otpDoc = await otpModel.findOne({
        email,
        otpHash
    })

    if (!otpDoc) {
        return res.status(400).json({
            message: "Invalid OTP"
        })
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user, {
        isVerified: true
    })

    await otpModel.deleteMany({
        user: otpDoc.user
    })

    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            username: user.username,
            email: user.email,
            verified: user.isVerified
        }
    })
}
