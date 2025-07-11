import { createUser, getUser, updateUser, deleteUser, getUsers } from "@/controllers/user-controller";
import {Router} from "express";
import  asyncHandler from 'express-async-handler';

const router = Router();

router.post("/", asyncHandler(createUser));
router.get("/:id", asyncHandler(getUser));
router.get("/", asyncHandler(getUsers));
router.patch("/:id", asyncHandler(updateUser));
router.delete("/:id", asyncHandler(deleteUser));

export default router;


