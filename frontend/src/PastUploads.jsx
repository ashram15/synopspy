import pdfIcon from './assets/pdf-icon.png';
import docxIcon from './assets/docx-icon.png';
import React, { useEffect, useState } from 'react';
import './App.css';

const PastUploads = () => {
    const [pastUploads, setPastUploads] = useState([]);
    <div className="past-uploads">
        <h3>Past Uploads</h3>
        {pastUploads.length === 0 ? (
            <p>No past uploads</p>
        ) : (

            <ul>
                {pastUploads.map((upload, index) => {
                    let icon = pdfIcon; // Default icon
                    if (upload.extension === "pdf") {
                        icon = pdfIcon;
                    } else if (upload.extension === "docx" || upload.extension === "doc") {
                        icon = docxIcon;
                    }
                    return (
                        <li key={index} className="past-upload-item" onClick={() => setUploadResult(upload.data)}>
                            <img src={icon} alt={`${upload.extension} icon`} style={{ width: '20px', height: '20px' }} />
                            <span>{upload.name}</span>
                        </li>
                    );
                })}
            </ul>
        )}
    </div>

};

const [pastUploads, setPastUploads] = useState([]);