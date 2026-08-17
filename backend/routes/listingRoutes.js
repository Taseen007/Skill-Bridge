import express from 'express';
import * as skillListingController from '../controllers/skillListingController.js';
import isAuthenticated from '../middlewares/isAuthenticated.js';

const router = express.Router();

// Create a new skill listing
router.post('/create', isAuthenticated, skillListingController.createSkillListing);
// Update an existing skill listing
router.put('/update/:id', isAuthenticated, skillListingController.updateSkillListing);
// Delete a skill listing
router.delete('/delete/:id', isAuthenticated, skillListingController.deleteSkillListing);
// Saved / wishlist routes (must come before parameterized single/:id)
router.post('/save/:id', isAuthenticated, skillListingController.toggleSaveListing);
router.get('/save/check/:id', isAuthenticated, skillListingController.checkSaved);
router.get('/saved/list', isAuthenticated, skillListingController.getSavedListings);
// Get All listings — public so unauthenticated users can browse the skills page
router.get('/all', skillListingController.getAllSkillListings);
// Get a single skill listing by ID — public so anyone can view details
router.get('/single/:id', skillListingController.getSkillListingById);
// Get skill listings by teacher ID
router.get('/teacher/:teacherId', isAuthenticated, skillListingController.getSkillListingsByTeacherId);
// Get tags for skill listings — public
router.get('/tags', skillListingController.getAllTagsFromListings);
// Get skill listings by tag
router.get('/tag/:tag', isAuthenticated, skillListingController.getSkillListingsByTag);

export default router;
