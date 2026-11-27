import { Router } from "express";
import { changePassword, getCsrfToken, getMe, login, logout } from "./auth.controller";
import { authenticate } from "../../middlewares/authenticate";
import { csrfProtection } from "./csrf/csrf.middleware";
import { validateOrigin } from "../../middlewares/validateOrigin";
const router = Router();

router.post("/login", validateOrigin, login);
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, validateOrigin, csrfProtection, logout);
router.get("/csrf", authenticate, getCsrfToken);
router.patch("/password",authenticate,validateOrigin,csrfProtection,changePassword);
export default router;