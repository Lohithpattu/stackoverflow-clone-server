import express from "express";

import { generateOTP, login, signup, verifyOTP } from "../controllers/auth.js";
import { getAllUsers, updateProfile, userLoginInfo } from "../controllers/users.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/getOTP",generateOTP)
router.post("/verifyOTP",verifyOTP)
router.get("/getLoginInfo/:id",userLoginInfo)
router.get("/getAllUsers", getAllUsers);
router.patch("/update/:id", auth, updateProfile);

export default router;
