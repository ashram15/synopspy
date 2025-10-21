import React, { use, useEffect, useState } from 'react';
import './App.css'
import './styles/modern.css'
import pdfIcon from './assets/pdf.png'
import { useAuth0 } from "@auth0/auth0-react";
import docxIcon from './assets/docx.png'
import loadImg from './assets/animation.gif'
import { FiUpload, FiFileText, FiAward, FiShield, FiAlertCircle, FiHelpCircle } from 'react-icons/fi';

const Upload = () => {
    const [uploadResult, setUploadResult] = useState(null); //uploadResult = null initially 
    const [loading, setLoading] = useState(false); //loading set to false initially 
    const [pastUploads, setPastUploads] = useState([]); //pastUploads is set to an empty array 
    const { getAccessTokenSilently } = useAuth0();

    // Fetch past uploads when component mounts
    useEffect(() => {
        fetchPastUploads();
    }, []);

    async function fetchPastUploads() {
        try {
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
            const token = await getAccessTokenSilently({ audience: "https://synopspy-backend.com/api" });

            const response = await fetch(`${BACKEND_URL}/uploads`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const uploads = await response.json();
                setPastUploads(uploads);
            } else {
                console.error("Failed to fetch past uploads:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching past uploads:", error);
        }
    }

    async function handleFileUpload(event) {
        const fileInput = document.querySelector('.file-input'); //will store a list of files in fileInput
        const file = fileInput.files[0]; //so we need the exact file in the list of files

        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        const extension = file.name.split('.').pop().toLowerCase(); // Get the file extension

        const formData = new FormData();
        formData.append('file', file); //"file" is the key expected by the backend

        setLoading(true);

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
        const token = await getAccessTokenSilently({ audience: "https://synopspy-backend.com/api" }); // Auth0 React hook

        try {
            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log(result)
                // alert("File Uploaded Successfully!");
                //Update UI
                setUploadResult(result);
                // Refresh past uploads to include the new upload
                fetchPastUploads();

            } else {
                console.error("File upload failed:", response.statusText);
                alert("File Upload Failed. Please try again.");
            }
        } catch (error) {

            console.error("Error uploading file:", error);
            alert("An error occurred while uploading the file. Please try again.");
        } finally {
            setLoading(false);
        }

        console.log("TOKEN", token)

    }

    return (
        <section id="upload">
            {!uploadResult && !loading ? (
                <div className="upload-container">
                    <div className="file-input-container">
                        <FiUpload className="upload-icon pulse" />
                        <p>Drop your file here or click to browse</p>
                        <input type="file" accept=".pdf, .doc, .docx" className="file-input" />
                    </div>
                    <button onClick={handleFileUpload} className="uploadButton">
                        <FiFileText className="button-icon" />
                        Synopsize Document
                    </button>
                </div>
            ) : loading ? (
                <div className="loading fade-in">
                    <img src={loadImg} alt="Loading..." />
                    <p className="loading-text">Analyzing your document...</p>
                </div>
            ) : (
                <div className="analysis-container fade-in">
                    <div className="upload-result">
                        <h2 className="result-title">Document Analysis Results</h2>

                        <div className="result-section topic-section">
                            <h3><FiAward className="section-icon" /> Topic</h3>
                            <p className="topic-text">{uploadResult["topic"]}</p>
                        </div>

                        <div className="result-section summary-section">
                            <h3><FiFileText className="section-icon" /> Summary</h3>
                            <p className="summary-text">{uploadResult["summary"]}</p>
                        </div>

                        <div className="result-section security-section">
                            <h3><FiShield className="section-icon" /> Security Analysis</h3>
                            <p className="security-level">{uploadResult["security_level"]}</p>
                        </div>

                        <div className="result-section concerns-section">
                            <h3><FiAlertCircle className="section-icon" /> Concerning Language</h3>
                            <ul className="concerns-list">
                                {uploadResult["concerning_language"].length > 0 ? (
                                    uploadResult["concerning_language"].map((phrase, index) => (
                                        <li key={index} className="concern-item">{phrase}</li>
                                    ))
                                ) : (
                                    <li className="no-concerns">No concerning language found.</li>
                                )}
                            </ul>
                        </div>

                        <div className="result-section questions-section">
                            <h3><FiHelpCircle className="section-icon" /> Questions to Consider</h3>
                            <ul className="questions-list">
                                {uploadResult["questions"].length > 0 ? (
                                    uploadResult["questions"].map((question, index) => (
                                        <li key={index} className="question-item">{question}</li>
                                    ))
                                ) : (
                                    <li className="no-questions">No questions to ask.</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="new-upload-container">
                        <div className="file-input-container">
                            <FiUpload className="upload-icon" />
                            <input type="file" accept=".pdf, .doc, .docx" className="file-input" />
                        </div>
                        <button onClick={handleFileUpload} className="uploadButton">
                            <FiFileText className="button-icon" />
                            Synopsize Another Document
                        </button>
                    </div>
                </div>
            )}

            <div className="past-uploads">
                <h3><FiFileText className="section-icon" /> Past Uploads</h3>
                {pastUploads.length === 0 ? (
                    <p className="no-uploads">No past uploads</p>
                ) : (
                    <ul className="uploads-list">
                        {pastUploads.map((upload, index) => {
                            let icon = upload.filename.toLowerCase().endsWith('.pdf') ? pdfIcon : docxIcon;
                            return (
                                <li
                                    key={upload._id || index}
                                    className="past-upload-item"
                                    onClick={() => setUploadResult(upload.analysis)}
                                >
                                    <img src={icon} alt={`${upload.filename.split('.').pop()} icon`} className="file-icon" />
                                    <div className="upload-info">
                                        <span className="filename">{upload.filename}</span>
                                        <small className="timestamp">
                                            {new Date(upload.timestamp).toLocaleDateString()}
                                        </small>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </section>
    );
}

export default Upload;
