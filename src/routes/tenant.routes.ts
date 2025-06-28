import { Router } from "express";
import {createTenant, getAllTenants}  from "../controllers/tenantController";

const router = Router();
router.post("/create", createTenant);
router.get("/", getAllTenants);
export default router;