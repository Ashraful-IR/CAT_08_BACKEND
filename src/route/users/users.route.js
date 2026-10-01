import express from "express";
import { editUserProfile } from "../../controllers/users/users.controller.js";
import { authMiddleware } from "../../middleware/auth.js";

const router = express.Router();

router.patch("/:email", authMiddleware, editUserProfile);

export default router;
