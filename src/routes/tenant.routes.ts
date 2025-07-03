import { Router } from "express";
import {createTenant, getAllTenants}  from "../controllers/tenant-controller";

const router = Router();
router.post("/create", createTenant);
router.get("/", getAllTenants);
export default router;