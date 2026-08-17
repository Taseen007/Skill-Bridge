import Chat from "../models/chatModel.js";


export const createChat = async (req, res) => {
  try {
    const { userId } = req.body; 
    const currentUserId = req.user.userId; 

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const existingChat = await Chat.findOne({
      users: { $all: [currentUserId, userId], $size: 2 },
    })
      .populate("users", "-password")
      .populate("latestMessage");

    if (existingChat) {
      return res.status(200).json(existingChat);
    }

    const newChat = new Chat({
      users: [currentUserId, userId],
    });

    const createdChat = await newChat.save();

    const fullChat = await Chat.findById(createdChat._id).populate(
      "users",
      "-password"
    );

    res.status(201).json(fullChat);
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};
