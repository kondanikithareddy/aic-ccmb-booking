import React, { useState } from 'react';
import axios from '../api/axios';
import * as XLSX from 'xlsx'; // <-- 1. Import the library

const AdminDataManagement = ({ onActionSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        setMessage('');
        try {
            const { data } = await axios.post('/equipment/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(data.message);
            if (onActionSuccess) onActionSuccess();
        } catch (error) {
            setMessage(error.response?.data?.message || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('/equipment/export', {
                responseType: 'blob', // Important: tells axios to handle the response as a file
            });
            // Create a URL for the blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Equipments.xlsx'); // The filename for the download
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link); // Clean up
        } catch (error) {
            console.error("Export failed", error);
            setMessage("Could not export the file.");
        }
    };
    
    // --- 2. NEW FUNCTION TO GENERATE AND DOWNLOAD THE TEMPLATE ---
    const handleDownloadTemplate = () => {
        // Define the sample data
        const sampleData = [
            { Name: 'Ultrasonic Cleaner', Category: 2, Status: 'Available' },
            { Name: 'Electrophoresis Unit', Category: 1, Status: 'Under Maintenance' },
        ];
        
        // Create a new worksheet from the sample data
        const worksheet = XLSX.utils.json_to_sheet(sampleData);
        
        // Create a new workbook
        const workbook = XLSX.utils.book_new();
        
        // Append the worksheet to the workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment Template');
        
        // Generate the Excel file and trigger the download
        XLSX.writeFile(workbook, 'Equipment_Import_Template.xlsx');
    };

    return (
        <div className="card">
            <h3>Data Management</h3>
            <hr />

            {/* --- 3. UPDATED IMPORT SECTION --- */}
            <h4>Import Equipment from Excel</h4>
            <div style={{ marginBottom: '15px' }}>
                <button onClick={handleDownloadTemplate}>Download Template File</button>
                <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '10px' }}>
                    <strong>Note:</strong>
                    <ul>
                        <li>Category 1: On-Demand</li>
                        <li>Category 2: 2-Hour Prep Required</li>
                        <li>Category 3: Always On (24/7)</li>
                    </ul>
                </div>
            </div>

            <p>Upload a completed Excel (.xlsx) file to add or update equipment.</p>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload & Sync from File'}
            </button>
            
            <hr style={{margin: '20px 0'}} />
            
            {/* This section now works correctly */}
            <h4>Export Equipment to Excel</h4>
            <p>Download a fresh Excel file containing all equipment currently in the system.</p>
            <button onClick={handleExport}>Export All Equipment</button>
            
            {message && <p style={{ marginTop: '15px' }}>{message}</p>}
        </div>
    );
};

export default AdminDataManagement;