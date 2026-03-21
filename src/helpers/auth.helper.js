import jwt from "jsonwebtoken";
import crypto from "crypto";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";

export async function createTokenPair(user, req) {
  const refreshToken = jwt.sign(
    { userId: user._id },
    config.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

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
    config.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" },
  );

  return { refreshToken, accessToken, session };
}

export function setRefreshCookie(res, token) {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
