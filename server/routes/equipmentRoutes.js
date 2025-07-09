const express = require('express');
const router = express.Router();
const multer = require('multer');

// --- KEY CHANGE: Add 'exportEquipment' to the import list ---
const { 
    getEquipment, 
    addEquipment, 
    updateEquipment, 
    deleteEquipment, 
    bulkImportEquipment,
    bulkDeleteEquipment,
    exportEquipment // <-- Imported the new function
} = require('../controllers/equipmentController');

const { protect, admin } = require('../middleware/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

// Route for getting the list and adding a single new equipment
router.route('/')
    .get(protect, getEquipment)
    .post(protect, admin, addEquipment);

// Route for bulk importing from an Excel file
router.route('/import')
    .post(protect, admin, upload.single('file'), bulkImportEquipment);

// --- NEW ROUTE: For exporting all equipment data to Excel ---
router.route('/export')
    .get(protect, admin, exportEquipment);

// Route for bulk deleting multiple equipment items
router.route('/bulk-delete')
    .post(protect, admin, bulkDeleteEquipment);

// Route for updating or deleting a SINGLE equipment item by its ID
router.route('/:id')
    .put(protect, admin, updateEquipment)
    .delete(protect, admin, deleteEquipment);

module.exports = router;