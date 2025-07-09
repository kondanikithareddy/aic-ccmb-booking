const Equipment = require('../models/equipmentModel');
const xlsx = require('xlsx');

// Get all equipment
const getEquipment = async (req, res) => {
    const equipment = await Equipment.find({ is_deleted: false });
    res.json(equipment);
};

// Add a single new equipment item (from the form)
const addEquipment = async (req, res) => {
    const { name, category, operational_status } = req.body;
    const equipment = new Equipment({ name, category, operational_status });
    const createdEquipment = await equipment.save();
    res.status(201).json(createdEquipment);
};

// Update a single equipment item
const updateEquipment = async (req, res) => {
    const { name, category, operational_status } = req.body;
    const equipment = await Equipment.findById(req.params.id);
    if (equipment) {
        equipment.name = name;
        equipment.category = category;
        equipment.operational_status = operational_status;
        const updatedEquipment = await equipment.save();
        res.json(updatedEquipment);
    } else {
        res.status(404).json({ message: 'Equipment not found' });
    }
};

// Soft-delete a single equipment item
const deleteEquipment = async (req, res) => {
    const equipment = await Equipment.findById(req.params.id);
    if (equipment) {
        equipment.is_deleted = true;
        await equipment.save();
        res.json({ message: 'Equipment removed' });
    } else {
        res.status(404).json({ message: 'Equipment not found' });
    }
};

// Handle bulk deletion of multiple equipment items
const bulkDeleteEquipment = async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: 'No equipment IDs provided.' });
    }
    try {
        const result = await Equipment.updateMany(
            { _id: { $in: ids } },
            { $set: { is_deleted: true } }
        );
        res.json({ message: `${result.modifiedCount} equipment items deleted.` });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting equipment.' });
    }
};

// Handle bulk import/sync from an Excel file
const bulkImportEquipment = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ message: 'The Excel sheet is empty.' });
        }
        
        const validEquipment = data.filter(row => row.Name && row.Category)
            .map(row => ({
                name: row.Name,
                category: parseInt(row.Category, 10),
                operational_status: ['Available', 'Under Maintenance'].includes(row.Status) ? row.Status : 'Available',
                is_deleted: false
            }));

        if (validEquipment.length > 0) {
            const operations = validEquipment.map(eq => ({
                updateOne: {
                    filter: { name: eq.name },
                    update: { $set: eq },
                    upsert: true
                }
            }));
            await Equipment.bulkWrite(operations);
            res.status(201).json({ message: `Successfully synced ${validEquipment.length} items from the file.` });
        } else {
            res.status(400).json({ message: 'No valid equipment data found in the file.' });
        }
    } catch (error) {
        console.error("Bulk import error:", error);
        res.status(500).json({ message: 'Error processing the file.' });
    }
};

// --- NEW FUNCTION TO HANDLE EXPORTING DATA TO EXCEL ---
const exportEquipment = async (req, res) => {
    try {
        // Fetch all non-deleted equipment from the database
        const equipment = await Equipment.find({ is_deleted: false }).select('name category operational_status -_id').lean();

        // Map the data to user-friendly column headers
        const dataForSheet = equipment.map(eq => ({
            Name: eq.name,
            Category: eq.category,
            Status: eq.operational_status
        }));
        
        // Create a new worksheet and workbook
        const worksheet = xlsx.utils.json_to_sheet(dataForSheet);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Equipment');

        // Set headers to tell the browser to download the file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Equipment_Export.xlsx');

        // Write the Excel file buffer to the response
        const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);
        
    } catch (error) {
        console.error("Export error:", error);
        res.status(500).json({ message: 'Failed to export data.' });
    }
};

// --- THIS IS THE CRITICAL FIX: Ensure ALL functions are exported ---
module.exports = { 
    getEquipment,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    bulkDeleteEquipment,
    bulkImportEquipment,
    exportEquipment // <-- Added the new export function here
};