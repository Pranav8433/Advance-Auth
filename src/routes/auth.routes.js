import express from "express";
import { registerController } from "../controllers/auth.controller.js";
const authRoutes = express.Router();

/**
 * @route -/api/auth/register
 */
authRoutes.post("/register", registerController);

export default authRoutes;
