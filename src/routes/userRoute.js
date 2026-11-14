import { Router } from "express";
import * as userController from "../controllers/userController.js";
import {
  validateCreateUser,
  validateUserId,
} from "../middlewares/validation.js";

const router = Router();

router.get("/", userController.getAllUsers);

router.post("/", validateCreateUser, userController.createUser);

router.get("/:id", validateUserId, userController.getUserById);

router.get("/:id/posts", validateUserId, userController.getPostsByUser);

export default router;
