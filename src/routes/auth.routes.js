import express from "express";
import { registerController, getMe } from "../controllers/auth.controller.js";
const authRoutes = express.Router();

/**
 * @route -/api/auth/register
 */
authRoutes.post("/register", registerController);

/**
 * @route - GET - /api/auth/get-me
 */
authRoutes.get("/get-me", getMe);

export default authRoutes;
