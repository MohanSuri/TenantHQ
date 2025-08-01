import { createUser, getUser, updateUser, terminateUser, getUsers } from "@/controllers/user-controller";
import {Router} from "express";
import  asyncHandler from 'express-async-handler';
import { authenticate } from '@middleware/authn-middleware';
import { doesUserHavePermission } from '@middleware/authz-middleware';

const router = Router();

router.post("/", authenticate, doesUserHavePermission('user:create'), asyncHandler(createUser));
router.get("/:id", asyncHandler(getUser));
router.get("/", asyncHandler(getUsers));
router.patch("/:id", asyncHandler(updateUser));
router.delete("/:id", authenticate, doesUserHavePermission('user:terminate'), asyncHandler(terminateUser));

export default router;


