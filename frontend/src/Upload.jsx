import React, { use, useEffect, useState } from 'react';
import './App.css'
import pdfIcon from './assets/pdf.png'
import { useAuth0 } from "@auth0/auth0-react";
import docxIcon from './assets/docx.png'
import loadImg from './assets/animation.gif'

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
                <>
                    <input type="file" accept=".pdf, .doc, .docx" className="file-input" />
                    <button onClick={handleFileUpload} className="uploadButton">Synopsize</button>
                </>
            ) : loading ? (
                <>
                    <div className="loading">
                        <img src={loadImg} alt="Loading..." style={{ width: '400px', height: '300px' }}></img>
                    </div>
                </>

            ) : (
                <>
                    <div className="upload-result">
                        <h2>Results</h2>
                        <h3><strong>Topic: </strong>{uploadResult["topic"]}</h3>
                        <h3><strong>Summary: </strong></h3>
                        <p>{uploadResult["summary"]}</p>
                        <h3><strong>Document Threat Analysis Rating:  </strong></h3>
                        <p>{uploadResult["security_level"]}</p>
                        <h3><strong>Concerning Language:</strong></h3>
                        <ul>
                            {uploadResult["concerning_language"].length > 0 ? (
                                uploadResult["concerning_language"].map((phrase, index) => (
                                    <li key={index}>{phrase}</li>
                                ))
                            ) : (
                                <li>No concerning language found.</li>
                            )}
                        </ul>
                        <h3><strong>Questions to ask:</strong></h3>
                        <ul>
                            {uploadResult["questions"].length > 0 ? (
                                uploadResult["questions"].map((question, index) => (
                                    <li key={index}>{question}</li>
                                ))
                            ) : (
                                <li>No questions to ask.</li>
                            )}
                        </ul>

                    </div>

                    <input type="file" accept=".pdf, .doc, .docx" className="file-input" />
                    <button onClick={handleFileUpload} className="uploadButton">Synopsize Again</button>

                </>

            )}

            <div className="past-uploads">
                <h3>Past Uploads</h3>
                {pastUploads.length === 0 ? (
                    <p>No past uploads</p>
                ) : (

                    <ul>
                        {pastUploads.map((upload, index) => {
                            let icon = pdfIcon; // Default icon
                            const extension = upload.filename.split('.').pop().toLowerCase();
                            if (extension === "pdf") {
                                icon = pdfIcon;
                            } else if (extension === "docx" || extension === "doc") {
                                icon = docxIcon;
                            }
                            return (
                                <li key={upload._id || index} className="past-upload-item" onClick={() => setUploadResult(upload.analysis)}>
                                    <img src={icon} alt={`${extension} icon`} style={{ width: '20px', height: '20px' }} />
                                    <span>{upload.filename}</span>
                                    <small style={{ display: 'block', color: '#666' }}>
                                        {new Date(upload.timestamp).toLocaleDateString()}
                                    </small>
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
