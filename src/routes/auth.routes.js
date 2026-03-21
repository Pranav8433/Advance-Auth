import express from "express";
import {
  registerController,
  getMe,
  refreshToken,
  logoutController,
  logoutAllController,
  loginController,
} from "../controllers/auth.controller.js";
const authRoutes = express.Router();

/**
 * @route -/api/auth/register
 */
authRoutes.post("/register", registerController);

/**
 * @route - GET - /api/auth/get-me
 */
authRoutes.get("/get-me", getMe);

/**
 * @route - GET /api/auth/refresh-token
 */
authRoutes.get("/refresh-token", refreshToken);

/**
 * @route - GET /api/auth/logout
 */
authRoutes.get("/logout", logoutController);
/**
 * @route - GET /api/auth/logout-all
 */
authRoutes.get("/logout-all", logoutAllController);

/**
 * @route - post /api/auth/login
 */

authRoutes.post("/login", loginController);

export default authRoutes;
