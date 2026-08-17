import Skill from "../models/skills.js";
import { User } from "../models/user.model.js";
import { canTeach } from "../utils/roleUtils.js";

const syncSkillToProfile = async (userId) => {
  try {
    const skillNames = await Skill.find({ userID: userId }).distinct('name');
    if (!skillNames) return;
    await User.findByIdAndUpdate(
      userId,
      { 'profile.skills': skillNames },
      { new: true }
    );
  } catch (err) {
    console.error('syncSkillToProfile error:', err);
  }
};


const assertCanTeach = async (userId, res) => {
    const user = await User.findById(userId).select('role');
    if (!user || !canTeach(user.role)) {
        res.status(403).json({ message: "Only teachers can manage detailed skills", success: false });
        return false;
    }
    return true;
};

// Create a new skill
export const createSkill = async (req, res) => {
    try {
        const { name, description, category, tags, level, experience } = req.body;
        const userId = req.user.userId; // Get userId from authenticated user

        if (!(await assertCanTeach(userId, res))) return;

        // Validate level field
        const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
        if (level && !validLevels.includes(level)) {
            return res.status(400).json({ 
                message: "Invalid level. Must be one of: Beginner, Intermediate, Advanced", 
                success: false 
            });
        }

        // Check if skill already exists for this user
        const existingSkill = await Skill.findOne({ name, userID: userId });
        if (existingSkill) {
            return res.status(400).json({ message: "Skill already exists for this user", success: false });
        }

        const newSkill = new Skill({
            userID: userId,
            name,
            description,
            category,
            tags,
            level,
            experience,
            // createdBy can be added if needed
        });

        await newSkill.save();
        await syncSkillToProfile(userId);
        const updatedUser = await User.findById(userId).select('profile.skills');
        
        // Populate user details to get full name
        const populatedSkill = await Skill.findById(newSkill._id).populate('userID', 'fullname email');
        
        return res.status(201).json({
            message: "Skill created successfully",
            success: true,
            skill: populatedSkill,
            profileSkills: updatedUser?.profile?.skills || [],
        });
    } catch (error) {
        console.error(error);
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, success: false });
        }
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Update an existing skill
export const updateSkill = async (req, res) => {
    try {
        const { skillId } = req.params;
        const { name, description, category, tags, level, experience } = req.body;
        const userId = req.user.userId; // Get userId from authenticated user

        if (!(await assertCanTeach(userId, res))) return;

        // Validate level field
        const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
        if (level && !validLevels.includes(level)) {
            return res.status(400).json({ 
                message: "Invalid level. Must be one of: Beginner, Intermediate, Advanced", 
                success: false 
            });
        }

        // Find the skill to update
        const skill = await Skill.findOne({ _id: skillId, userID: userId });
        if (!skill) {
            return res.status(404).json({ message: "Skill not found", success: false });
        }

        // Check if new name conflicts with existing skill (if name is being changed)
        if (name && name !== skill.name) {
            const existingSkill = await Skill.findOne({ name, userID: userId });
            if (existingSkill) {
                return res.status(400).json({ message: "Skill with this name already exists for this user", success: false });
            }
        }

        // Update fields (use proper checks for falsy values)
        if (name !== undefined) skill.name = name;
        if (description !== undefined) skill.description = description;
        if (category !== undefined) skill.category = category;
        if (tags !== undefined) skill.tags = tags;
        if (level !== undefined) skill.level = level;
        if (experience !== undefined) skill.experience = experience;

        await skill.save();
        await syncSkillToProfile(userId);
        
        // Populate user details to get full name
        const populatedSkill = await Skill.findById(skill._id).populate('userID', 'fullname email');
        
        return res.status(200).json({ message: "Skill updated successfully", success: true, skill: populatedSkill });
    } catch (error) {
        console.error(error);
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, success: false });
        }
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Delete a skill 
export const deleteSkill = async (req, res) => {
    try {
        const { skillId } = req.params;
        const userId = req.user.userId; // Get userId from authenticated user

        if (!(await assertCanTeach(userId, res))) return;

        const skill = await Skill.findOneAndDelete({ _id: skillId, userID: userId });
        if (!skill) {
            return res.status(404).json({ message: "Skill not found", success: false });
        }
        await syncSkillToProfile(userId);

        return res.status(200).json({ message: "Skill deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get all skills
export const getSkills = async (req, res) => {
    try {
        const userId = req.user.userId; // Get userId from authenticated user
        const skills = await Skill.find({ userID: userId }).populate('userID', 'fullname email'); // Populate user details if needed
        const count = skills.length; // Get the count of skills
        return res.status(200).json({ 
            message: "Skills retrieved successfully", 
            success: true, 
            skills,
            count 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get all skills of a user
export const getAllSkillsByUser = async (req, res) => {
    try {
        const userId = req.params.userId; // Get userId from request parameters
        const skills = await Skill.find({ userID: userId }).populate('userID', 'fullname email'); // Populate user details if needed
        const count = skills.length; // Get the count of skills
        return res.status(200).json({ 
            message: "Skills retrieved successfully", 
            success: true, 
            skills,
            count 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get a specific skill by ID
export const getSkillById = async (req, res) => {
    try {
        const { skillId } = req.params;
        const userId = req.user.userId; // Get userId from authenticated user

        const skill = await Skill.findOne({ _id: skillId, userID: userId }).populate('userID', 'fullname email');
        if (!skill) {
            return res.status(404).json({ message: "Skill not found", success: false });
        }

        return res.status(200).json({ message: "Skill retrieved successfully", success: true, skill });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
