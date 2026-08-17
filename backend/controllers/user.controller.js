import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import Skill from "../models/skills.js";

// Sync a user's detailed Skill records into profile.skills[]
const syncSkillsToProfile = async (userId) => {
  try {
    const skillNames = await Skill.find({ userID: userId }).distinct('name');
    await User.findByIdAndUpdate(
      userId,
      { 'profile.skills': skillNames },
      { new: true }
    );
  } catch (err) {
    console.error('syncSkillsToProfile error:', err);
  }
};

// Register Controller
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    // Basic validations
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({ message: "Missing required fields", success: false });
    }

    const profilePic = req.files?.profilePhoto?.[0];
    if (!profilePic) {
      return res.status(400).json({ message: "Avatar file is missing", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const fileUri = getDataUri(profilePic);
    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: cloudResponse.secure_url,
      },
    });

    return res.status(201).json({ message: "Account created successfully", success: true });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Missing email, password, or role", success: false });
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Incorrect email or password", success: false });
    }

    const roleMatches =
      role === user.role ||
      (role === 'teacher' && user.role === 'both') ||
      (role === 'learner' && user.role === 'both');

    if (!roleMatches) {
      return res.status(400).json({ message: "Account doesn't exist with current role", success: false });
    }

    await syncSkillsToProfile(user._id);
    const refreshed = await User.findById(user._id);

    const token = jwt.sign({ userId: refreshed._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    const safeUser = {
      _id: refreshed._id,
      fullname: refreshed.fullname,
      email: refreshed.email,
      phoneNumber: refreshed.phoneNumber,
      role: refreshed.role,
      profile: refreshed.profile,
      savedListings: refreshed.savedListings || [],
      createdAt: refreshed.createdAt,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${refreshed.fullname}`,
        user: safeUser,
        token: token,
        success: true,
      });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Logout Controller
export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", { maxAge: 0 })
      .json({ message: "Logged out successfully", success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Update Profile Controller
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, location } = req.body;
    const profilePic = req.files?.profilePhoto?.[0];

    const userId = req.user.userId;
    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ message: "User not found", success: false });
    }

    if (!user.profile) user.profile = {};

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (location !== undefined) user.profile.location = location;
    
    // Handle skills update (from comma-separated quick edit)
    if (req.body.skills) {
      try {
        const skillsArray = JSON.parse(req.body.skills);
        user.profile.skills = skillsArray;
      } catch (e) {
        console.error('Error parsing skills:', e);
      }
    }

    if (profilePic) {
      const fileUri = getDataUri(profilePic);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      user.profile.profilePhoto = cloudResponse.secure_url;
    }

    await user.save();
    await syncSkillsToProfile(userId);
    const after = await User.findById(userId);

    const updatedUser = {
      _id: after._id,
      fullname: after.fullname,
      email: after.email,
      phoneNumber: after.phoneNumber,
      role: after.role,
      profile: after.profile,
      savedListings: after.savedListings || [],
      createdAt: after.createdAt,
    };

    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
      success: true,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};


// Get user by ID Controller
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    await syncSkillsToProfile(userId);
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }
    return res.status(200).json({ user, success: true });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Upgrade a user's role (learner -> teacher -> both)
export const upgradeRole = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetRole } = req.body;
    const validRoles = ['teacher', 'learner', 'both'];
    if (!validRoles.includes(targetRole)) {
      return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}`, success: false });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found", success: false });
    }

    user.role = targetRole;
    await user.save();

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
      savedListings: user.savedListings || [],
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      message: `Role updated to ${targetRole}`,
      user: safeUser,
      success: true,
    });
  } catch (error) {
    console.error("Upgrade role error:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};
