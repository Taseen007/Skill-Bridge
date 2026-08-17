import express from "express"
import { createChat } from "../controllers/chatController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { allMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.route("/chat").post(isAuthenticated, createChat);
router.route("/:chatId").get(isAuthenticated, allMessages);
router.route("/chatsend").post(isAuthenticated, sendMessage);


export default router;