import Notification from '../models/notificationModel.js';

export const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId; 
        const notifications = await Notification.find({ recipient: userId }).populate('sender', 'fullname profile.profilePhoto').sort({ createdAt: -1 }); // Sort by timestamp, descending
       
        res.json({ success: true, notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { $set: { isRead: true } }
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

