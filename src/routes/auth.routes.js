import express from "express";
import {
  registerController,
  loginController,
  getMe,
  refreshTokenController,
  logoutController,
  logoutAllController,
} from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const authRoutes = express.Router();

/**
 * @route   POST /api/auth/register
 * @access  Public
 */
authRoutes.post("/register", registerController);

/**
 * @route   POST /api/auth/login
 * @access  Public (rate limited)
 */
authRoutes.post("/login", loginLimiter, loginController);

/**
 * @route   GET /api/auth/get-me
 * @access  Protected
 */
authRoutes.get("/get-me", authenticate, getMe);

/**
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
authRoutes.post("/refresh-token", refreshTokenController);

/**
 * @route   POST /api/auth/logout
 * @access  Public
 */
authRoutes.post("/logout", logoutController);

/**
 * @route   POST /api/auth/logout-all
 * @access  Public
 */
authRoutes.post("/logout-all", logoutAllController);

export default authRoutes;
