import React, { use, useEffect, useState } from 'react';
import './App.css'
import pdfIcon from './assets/pdf.png'
import docxIcon from './assets/docx.png'
import loadImg from './assets/animation.gif'

const Upload = () => {
    const [uploadResult, setUploadResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pastUploads, setPastUploads] = useState([]);

    async function handleFileUpload(event) {
        const fileInput = document.querySelector('.file-input');
        const file = fileInput.files[0];
        const extension = file.name.split('.').pop().toLowerCase(); // Get the file extension

        if (!file) {
            alert("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file); //"file" is the key expected by the backend

        setLoading(true);

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

        try {
            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                body: formData,
                // Content-Type header is automatically set to multipart/form-data by FormData
            });

            if (response.ok) {
                const result = await response.json();
                console.log(result)
                // alert("File Uploaded Successfully!");
                //Update UI
                setUploadResult(result);
                setPastUploads(prev => [...prev, { name: file.name, type: file.type, extension: extension, data: result }]); // Store the uploaded file data

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

    }

    useEffect(() => {
        if (uploadResult) {
            console.log("uploadResult updated:", uploadResult["questions"]);

        }
    }, [uploadResult]);

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
                        <p>{uploadResult["concerning_language"]}</p>
                        <h3><strong>Questions to ask:</strong></h3>
                        <ul>
                            {uploadResult["questions"].map((question, index) => (
                                <li key={index}>{question}</li>
                            ))}
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
        </section>
    );
}

export default Upload;
