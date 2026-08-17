import SkillListing from "../models/skillListing.js";
import Skill from "../models/skills.js";
import { User } from "../models/user.model.js";
import { canTeach } from "../utils/roleUtils.js";

const parseNumber = (val, fallback = null) => {
  if (val === undefined || val === null || val === '') return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

// Create a new skill listing
export const createSkillListing = async (req, res) => {
    try {
        const { title, description, fee, proficiency, skillID, listingImgURL, availableSlots, totalSessions } = req.body;
        const teacherID = req.user.userId; // Get teacherID from authenticated user

        const user = await User.findById(teacherID).select('role');
        if (!user || !canTeach(user.role)) {
            return res.status(403).json({ message: "Only teachers can create skill listings", success: false });
        }

        // Validate fee
        if (fee < 0) {
            return res.status(400).json({ message: "Fee cannot be negative", success: false });
        }

        // Check if skill exists
        const skill = await Skill.findById(skillID);
        if (!skill) {
            return res.status(404).json({ message: "Skill not found", success: false });
        }

        // Check if the skill belongs to the authenticated user
        if (skill.userID.toString() !== teacherID) {
            return res.status(403).json({ message: "You can only create listings for your own skills", success: false });
        }

        const newListing = new SkillListing({
            title,
            description,
            fee,
            totalSessions,
            proficiency,
            skillID,
            teacherID, 
            listingImgURL,
            availableSlots: Array.isArray(availableSlots) ? availableSlots : []
        });

        await newListing.save();

        // Populate teacher details to get full name
        const populatedListing = await SkillListing.findById(newListing._id).populate('teacherID', 'fullname email profile.profilePhoto');

        return res.status(201).json({ message: "Skill listing created successfully", success: true, listing: populatedListing });
    } 
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


// Update an existing skill listing
export const updateSkillListing = async (req, res) => {
    try {
        const { title, description, fee, proficiency, skillID, listingImgURL, availableSlots, totalSessions } = req.body;
        const listingID = req.params.id;
        const teacherID = req.user.userId;

        // Role check: only teachers can update listings
        const user = await User.findById(teacherID).select('role');
        if (!user || !canTeach(user.role)) {
            return res.status(403).json({ message: "Only teachers can update skill listings", success: false });
        }

        // Validate fee
        if (fee < 0) {
            return res.status(400).json({ message: "Fee cannot be negative", success: false });
        }

        const skill = await Skill.findById(skillID);
        if (!skill) {
            return res.status(404).json({ message: "Skill not found", success: false });
        }

        // Check if the skill belongs to the authenticated user
        if (skill.userID.toString() !== teacherID) {
            return res.status(403).json({ message: "You can only update listings for your own skills", success: false });
        }

        // Check if listing exists
        const listing = await SkillListing.findById(listingID);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found", success: false });
        }

        // Check if the listing belongs to the authenticated user
        if (listing.teacherID.toString() !== teacherID) {
            return res.status(403).json({ message: "You can only update your own listings", success: false });
        }

        // Update listing details
        listing.title = title;
        listing.description = description;
        listing.fee = fee;
        listing.proficiency = proficiency;
        listing.skillID = skillID;
        listing.listingImgURL = listingImgURL;
        if (totalSessions !== undefined) {
            listing.totalSessions = totalSessions;
        }
        if (Array.isArray(availableSlots)) {
            listing.availableSlots = availableSlots;
        }

        await listing.save();

        return res.status(200).json({ message: "Skill listing updated successfully", success: true, listing });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


// Delete a skill listing
export const deleteSkillListing = async (req, res) => {
    try {
        const listingID = req.params.id;
        const teacherID = req.user.userId;

        // Check if listing exists
        const listing = await SkillListing.findById(listingID);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found", success: false });
        }

        // Check if the listing belongs to the authenticated user
        if (listing.teacherID.toString() !== teacherID) {
            return res.status(403).json({ message: "You can only delete your own listings", success: false });
        }
        await SkillListing.findByIdAndDelete(listingID);
        return res.status(200).json({ message: "Listing deleted successfully", success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};


// Get all skill listings with search, filters, and sorting
export const getAllSkillListings = async (req, res) => {
    try {
        const {
            search,
            minFee,
            maxFee,
            minRating,
            category,
            tags,
            level,
            sort,
            teacherId,
        } = req.query;

        const filter = {};

        // Build a query with joins: first find skill IDs by category/level/search-on-skill
        const skillFilter = {};
        if (category) skillFilter.category = { $regex: new RegExp(category, 'i') };
        if (tags) skillFilter.tags = { $regex: new RegExp(tags, 'i') };
        if (level) skillFilter.level = { $regex: new RegExp(level, 'i') };
        if (search) skillFilter.$or = [
            { name: { $regex: new RegExp(search, 'i') } },
            { tags: { $regex: new RegExp(search, 'i') } },
        ];

        // Get matching skill IDs (if any skill-level filter applied)
        const hasSkillFilter = Object.keys(skillFilter).length > 0;
        let matchingSkillIds = null;
        if (hasSkillFilter) {
            const skills = await Skill.find(skillFilter).select('_id');
            matchingSkillIds = skills.map(s => s._id);
            filter.skillID = { $in: matchingSkillIds };
        }

        // Listing-level filters
        if (teacherId) filter.teacherID = teacherId;
        const minF = parseNumber(minFee);
        const maxF = parseNumber(maxFee);
        if (minF !== null || maxF !== null) {
            filter.fee = {};
            if (minF !== null) filter.fee.$gte = minF;
            if (maxF !== null) filter.fee.$lte = maxF;
        }
        const minR = parseNumber(minRating);
        if (minR !== null) filter.avgRating = { $gte: minR };

        // Search also matches on listing title/description and the teacher's name
        if (search) {
            const matchingTeachers = await User.find({ fullname: { $regex: new RegExp(search, 'i') } }).select('_id');
            const teacherIds = matchingTeachers.map(u => u._id);

            const listingSearch = {
                $or: [
                    { title: { $regex: new RegExp(search, 'i') } },
                    { description: { $regex: new RegExp(search, 'i') } },
                ]
            };
            if (teacherIds.length > 0) {
                listingSearch.$or.push({ teacherID: { $in: teacherIds } });
            }
            if (hasSkillFilter) {
                filter.$or = listingSearch.$or;
            } else {
                // Also try search inside Skills' name/tags via skillID $in
                const skillsByName = await Skill.find({
                    $or: [
                        { name: { $regex: new RegExp(search, 'i') } },
                        { tags: { $regex: new RegExp(search, 'i') } },
                    ]
                }).select('_id');
                const ids = skillsByName.map(s => s._id);
                if (ids.length > 0) {
                    listingSearch.$or.push({ skillID: { $in: ids } });
                }
                Object.assign(filter, listingSearch);
            }
        }

        // Sort
        let sortObj = { createdAt: -1 };
        switch (sort) {
            case 'popular':
                sortObj = { avgRating: -1, createdAt: -1 };
                break;
            case 'newest':
                sortObj = { createdAt: -1 };
                break;
            case 'price_asc':
                sortObj = { fee: 1, createdAt: -1 };
                break;
            case 'price_desc':
                sortObj = { fee: -1, createdAt: -1 };
                break;
            case 'rating':
                sortObj = { avgRating: -1, createdAt: -1 };
                break;
            default:
                sortObj = { createdAt: -1 };
        }

        const listings = await SkillListing.find(filter)
            .populate('teacherID', 'fullname email profile.profilePhoto profile.location')
            .populate('skillID', 'tags name category level')
            .sort(sortObj);

        const count = listings.length;
        return res.status(200).json({ 
            message: "Skill listings retrieved successfully", 
            success: true, 
            listings,
            count,
            appliedFilters: { search, minFee, maxFee, minRating, category, level, sort, teacherId }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get skill listings by listing ID
export const getSkillListingById = async (req, res) => {
    try {
        const listingID = req.params.id;

        // Check if listing exists
        const listing = await SkillListing.findById(listingID)
            .populate('teacherID', 'fullname email profile.profilePhoto profile.location')
            .populate('skillID', 'name tags level experience');
        if (!listing) {
            return res.status(404).json({ message: "Listing not found", success: false });
        }
        return res.status(200).json({ message: "Skill listing retrieved successfully", success: true, listing });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get skill listings by teacher ID
export const getSkillListingsByTeacherId = async (req, res) => {
    try {
        const teacherID = req.params.teacherId;

        // Check if teacher exists
        const teacher = await User.findById(teacherID);
        if (!teacher) {
            return res.status(404).json({ message: "Teacher not found", success: false });
        }

        // Get listings by teacher ID
        const listings = await SkillListing.find({ teacherID }).populate('skillID', 'name');
        const count = listings.length; // Get the count of listings
        return res.status(200).json({ 
            message: "Skill listings retrieved successfully", 
            success: true, 
            listings,
            count 
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get skill listings by tag
export const getSkillListingsByTag = async (req, res) => {
    try {
        const tag = req.params.tag;

        // First, find skills that have the specified tag
        const skillsWithTag = await Skill.find({ tags: tag });
        
        if (skillsWithTag.length === 0) {
            return res.status(200).json({
                message: "No skills found with this tag",
                success: true,
                listings: [],
                count: 0
            });
        }

        // Get the skill IDs
        const skillIds = skillsWithTag.map(skill => skill._id);

        // Find listings that reference these skills
        const listings = await SkillListing.find({ skillID: { $in: skillIds } })
            .populate('teacherID', 'fullname email profile.profilePhoto profile.location')
            .populate('skillID', 'name tags');
            
        const count = listings.length; // Get the count of listings
        return res.status(200).json({
            message: "Skill listings retrieved successfully",
            success: true,
            listings,
            count
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get all tags from skill listings with counts
export const getAllTagsFromListings = async (req, res) => {
    try {
        const listings = await SkillListing.find().populate('skillID', 'tags');
        const tagCounts = new Map();

        listings.forEach(listing => {
            if (listing.skillID && listing.skillID.tags) {
                listing.skillID.tags.forEach(tag => {
                    // Normalize tag by converting to lowercase for comparison
                    const normalizedTag = tag.toLowerCase();
                    
                    // If we've seen this tag before (case-insensitive), increment count
                    let existingEntry = null;
                    for (let [existingTag, data] of tagCounts.entries()) {
                        if (existingTag.toLowerCase() === normalizedTag) {
                            existingEntry = existingTag;
                            break;
                        }
                    }
                    
                    if (existingEntry) {
                        // Increment count for existing tag
                        tagCounts.get(existingEntry).count++;
                    } else {
                        // Use proper case version (capitalize first letter)
                        const properCaseTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
                        tagCounts.set(properCaseTag, { count: 1 });
                    }
                });
            }
        });

        // Convert Map to array with tag and count
        const tagsWithCounts = Array.from(tagCounts.entries()).map(([tag, data]) => ({
            tag: tag,
            count: data.count
        }));

        // Sort by count (descending) then by tag name (ascending)
        tagsWithCounts.sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.tag.localeCompare(b.tag);
        });

        return res.status(200).json({
            message: "Tags with counts retrieved successfully",
            success: true,
            tags: tagsWithCounts,
            totalUniqueTags: tagsWithCounts.length
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Toggle save a listing (add/remove from wishlist)
export const toggleSaveListing = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const listing = await SkillListing.findById(id);
        if (!listing) {
            return res.status(404).json({ message: "Listing not found", success: false });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        if (!Array.isArray(user.savedListings)) user.savedListings = [];

        const idx = user.savedListings.findIndex(lid => lid.toString() === id);
        let isSaved;
        if (idx >= 0) {
            user.savedListings.splice(idx, 1);
            isSaved = false;
        } else {
            user.savedListings.push(id);
            isSaved = true;
        }
        await user.save();

        return res.status(200).json({
            message: isSaved ? "Listing saved" : "Listing removed from saved",
            success: true,
            isSaved,
            savedListings: user.savedListings
        });
    } catch (error) {
        console.error("toggleSaveListing error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Check if a listing is saved
export const checkSaved = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        const arr = user.savedListings || [];
        const isSaved = arr.some(lid => lid.toString() === id);
        return res.status(200).json({ success: true, isSaved });
    } catch (error) {
        console.error("checkSaved error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};

// Get all saved listings for the current user
export const getSavedListings = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found", success: false });
        }
        const ids = user.savedListings || [];
        const listings = await SkillListing.find({ _id: { $in: ids } })
            .populate('teacherID', 'fullname email profile.profilePhoto profile.location')
            .populate('skillID', 'tags name category level');

        return res.status(200).json({
            message: "Saved listings retrieved",
            success: true,
            listings,
            count: listings.length
        });
    } catch (error) {
        console.error("getSavedListings error:", error);
        return res.status(500).json({ message: "Internal server error", success: false });
    }
};
