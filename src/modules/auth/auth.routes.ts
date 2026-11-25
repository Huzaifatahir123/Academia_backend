import { Router } from "express";
import { getMe, login } from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";
const router = Router();

router.post("/login", login);
router.get("/me", authenticate, getMe);
export default router;