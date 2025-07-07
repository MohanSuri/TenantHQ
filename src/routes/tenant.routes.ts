import { Router } from "express";
import {createTenant, getAllTenants}  from "../controllers/tenant-controller";
import  asyncHandler from 'express-async-handler';

const router = Router();
router.post("/create", asyncHandler(createTenant));
router.get("/", asyncHandler(getAllTenants));
export default router;