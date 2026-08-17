import express from "express";
import * as skillController from "../controllers/skillsController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/create", isAuthenticated, skillController.createSkill);
router.put("/update/:skillId", isAuthenticated, skillController.updateSkill);
router.get("/all", isAuthenticated, skillController.getSkills);
router.delete("/delete/:skillId", isAuthenticated, skillController.deleteSkill);
router.get("/user/:userId", skillController.getAllSkillsByUser); // Added the missing route
router.get("/single/:skillId", isAuthenticated, skillController.getSkillById);

export default router;