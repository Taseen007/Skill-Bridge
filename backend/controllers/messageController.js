import expressAsyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import { User } from "../models/user.model.js";
import Chat from "../models/chatModel.js";
import Notification from "../models/notificationModel.js";
import { emitToChat, emitToUser } from "../utils/realtime.js";
import { sendNotificationEmail } from "../utils/email.js";
const allMessages = expressAsyncHandler(async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.users.some((u) => u.toString() === req.user.userId)) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "fullname profile.profilePhoto")
      .populate("chat");
    const latestMessage = messages[messages.length - 1];
    if (latestMessage && !latestMessage.readBy.includes(req.user.userId)) {
      latestMessage.readBy.push(req.user.userId);
      await latestMessage.save();
    }
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const sendMessage = expressAsyncHandler(async (req, res) => {
  const { content, chat } = req.body;

  if (!content || !chat) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  try {
    const chatDoc = await Chat.findById(chat);
    if (!chatDoc || !chatDoc.users.some((u) => u.toString() === req.user.userId)) {
      return res.status(403).json({ message: "Not authorized to send to this chat" });
    }

    // Create the message
    let newMessage = {
      sender: req.user.userId,
      content,
      chat,
      readBy: [req.user.userId],
    };

    let message = await Message.create(newMessage);

    message = await message.populate("sender", "fullname profile.profilePhoto");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.users",
      select: "fullname email profile.profilePhoto",
    });

    // Update latestMessage in chat
    await Chat.findByIdAndUpdate(chat, { latestMessage: message });

    // ✅ Find recipient(s) for notification
    const chatData = message.chat;
    const recipients = chatData.users.filter(
      (u) => u._id.toString() !== req.user.userId.toString()
    );

    // ✅ Create a notification for each recipient
    for (const recipient of recipients) {
      const notification = new Notification({
        recipient: recipient._id,
        sender: req.user.userId,
        message: `New message from ${message.sender.fullname}`,
        type: "message",
        relatedChat: chat, 
      });
      await notification.save();
      emitToUser(recipient._id, "notification:new", notification);
      sendNotificationEmail({
        to: recipient.email,
        subject: "New SkillBridge message",
        text: `${message.sender.fullname} sent you a message.`,
      }).catch(console.error);
    }

    emitToChat(chat, "message:new", message);

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});


export { allMessages, sendMessage };
