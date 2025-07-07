import { Router } from "express";
import { login } from "../controllers/auth-controller";
import  asyncHandler from 'express-async-handler';

const router = Router();
router.post("/signup", (req, res) => {});
router.post("/login", asyncHandler(login));

export default router;