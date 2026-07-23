import React, { useEffect, useState } from 'react';
import './App.css';
import './styles/modern.css';
import pdfIcon from './assets/pdf.png';
import docxIcon from './assets/docx.png';
import loadImg from './assets/animation.gif';
import { useAuth0 } from '@auth0/auth0-react';
import { FiUpload, FiFileText, FiAlertCircle, FiMessageCircle } from 'react-icons/fi';
import mammoth from 'mammoth';
import DocumentChatWidget from './DocumentChatWidget';

const Upload = () => {
    const [uploadResult, setUploadResult] = useState(null);
    const [currentUploadId, setCurrentUploadId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pastUploads, setPastUploads] = useState([]);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [docxPreviewHtml, setDocxPreviewHtml] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [chatOpen, setChatOpen] = useState(false);
    const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();

    // Fetch past uploads when component mounts (only if authenticated)
    useEffect(() => {
        if (isAuthenticated) {
            fetchPastUploads();
        }
    }, [isAuthenticated]);

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

    function handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
        event.target.value = null;
    }

    const handleReset = () => {
        setSelectedFile(null);
        setUploadResult(null);
        setCurrentUploadId(null);
        setUploadedFile(null);
        setFilePreviewUrl(null);
        setDocxPreviewHtml(null);
        setLoading(false);
        setChatOpen(false);
    };

    async function handleDownloadPDF() {
        if (!currentUploadId || !isAuthenticated) return;

        try {
            const token = await getAccessTokenSilently({ audience: "https://synopspy-backend.com/api" });
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

            const response = await fetch(`${BACKEND_URL}/analysis/${currentUploadId}/pdf`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'analysis.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const errorText = await response.text();
                console.error("Error response:", errorText);
                alert(`Failed to download PDF: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
            alert(`Error downloading PDF: ${error.message}`);
        }
    }

    async function handleFileUpload(event) {
        // Use the state variable strictly
        if (!selectedFile) {
            alert("Please select a file to upload.");
            return;
        }

        const file = selectedFile; // Use the state!
        setUploadedFile(file);     // Save it for the preview section

        // --- Preview Logic (Moved here to be safe) ---
        if (file.type === 'application/pdf') {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
            setDocxPreviewHtml(null);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setDocxPreviewHtml(result.value);
                setFilePreviewUrl(null);
            } catch (error) {
                console.error('Error converting DOCX:', error);
                setDocxPreviewHtml('<p>Error loading DOCX preview</p>');
            }
        } else {
            setFilePreviewUrl(null);
            setDocxPreviewHtml(null);
        }
        // ---------------------------------------------

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

        try {
            const headers = {};
            if (isAuthenticated) {
                const token = await getAccessTokenSilently({ audience: "https://synopspy-backend.com/api" });
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`${BACKEND_URL}/upload`, {
                method: "POST",
                headers: headers,
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();

                if (result.error) {
                    if (result.error.includes('503') || result.error.includes('overloaded')) {
                        alert("The AI service is currently overloaded. Please try again in a few moments.");
                    } else {
                        alert("Analysis failed: " + result.error);
                    }
                    setLoading(false);
                    return;
                }

                // Extract upload_id if present
                const { upload_id, ...analysisData } = result;
                setUploadResult(analysisData);
                setCurrentUploadId(upload_id || null);
                if (isAuthenticated) fetchPastUploads();
            } else {
                let errorMessage = "File upload failed";
                try {
                    const errorData = await response.json();
                    if (errorData.detail) errorMessage = errorData.detail;
                } catch (e) {
                    console.error("Could not parse error JSON", e);
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section id="upload">
            {!uploadResult && !loading ? (
                <div className="upload-container">
                    <h2 className="upload-title">Upload your document</h2>
                    <p className="upload-subtitle"> terms and conditions, privacy policy, etc.</p>
                    <p className="upload-subtitle"> Receive AI-powered summaries and risk insights in seconds.</p>

                    <div className="file-input-container">
                        <FiUpload className="upload-icon pulse" />
                        <p>Drop your file here or click to browse. Accepts PDF and DOCX files.</p>
                        <input
                            type="file"
                            accept=".pdf, .docx, application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            className="file-input"
                            onChange={handleFileSelect}
                        />
                    </div>

                    {selectedFile && (
                        <div className="selected-file-preview">
                            <div className="selected-file-info">
                                <img
                                    src={selectedFile.name.toLowerCase().endsWith('.pdf') ? pdfIcon : docxIcon}
                                    alt="File type"
                                    className="file-type-icon"
                                />
                                <div className="file-details">
                                    <span className="filename">{selectedFile.name}</span>
                                    <span className="filesize">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                <button
                                    className="remove-file-btn"
                                    onClick={() => setSelectedFile(null)}
                                    type="button"
                                >
                                    <FiAlertCircle />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="upload-button-container">
                        <button
                            onClick={handleFileUpload}
                            className="uploadButton"
                            disabled={!selectedFile}
                        >
                            <FiFileText className="button-icon" />
                            Analyze Document
                        </button>
                    </div>
                </div>
            ) : loading ? (
                <div className="loading">
                    <img src={loadImg} alt="Loading..." className="loading-animation" />
                </div>
            ) : (
                <div className="analysis-container fade-in">
                    {uploadResult ? (
                        <>
                            <h2 className="result-title">Document Analysis Results</h2>
                            {isAuthenticated && currentUploadId ? (
                                <button
                                    type="button"
                                    className="chat-cta-banner"
                                    onClick={() => setChatOpen(true)}
                                >
                                    <span className="chat-cta-banner-icon" aria-hidden>
                                        <FiMessageCircle />
                                    </span>
                                    <span className="chat-cta-banner-copy">
                                        <strong>Ask questions about this document</strong>
                                        <span>Get answers grounded only in this upload</span>
                                    </span>
                                    <span className="chat-cta-banner-action">Open chat</span>
                                </button>
                            ) : !isAuthenticated ? (
                                <button
                                    type="button"
                                    className="chat-cta-banner chat-cta-banner--guest"
                                    onClick={() => loginWithRedirect()}
                                >
                                    <span className="chat-cta-banner-icon" aria-hidden>
                                        <FiMessageCircle />
                                    </span>
                                    <span className="chat-cta-banner-copy">
                                        <strong>Want to chat with this document?</strong>
                                        <span>Sign in to ask grounded questions (saved to your account only)</span>
                                    </span>
                                    <span className="chat-cta-banner-action">Sign in</span>
                                </button>
                            ) : null}
                            <div className="results-layout">
                                {/* Document Preview Column */}
                                <div className="document-preview-column">
                                    <div className="document-viewer">
                                        {uploadedFile && uploadedFile.type === 'application/pdf' && filePreviewUrl ? (
                                            <iframe
                                                src={filePreviewUrl}
                                                title="Document Preview"
                                                className="pdf-preview"
                                            />
                                        ) : uploadedFile && docxPreviewHtml ? (
                                            <div
                                                className="docx-preview"
                                                dangerouslySetInnerHTML={{ __html: docxPreviewHtml }}
                                            />
                                        ) : (
                                            <div className="preview-placeholder">
                                                <img src={docxIcon} alt="Document" className="preview-icon" />
                                                <p className="preview-text">
                                                    {uploadedFile?.name || "Document"} preview
                                                </p>
                                                <small>Document preview not available</small>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Analysis Results Column */}
                                <div className="analysis-results-column">
                                    <div className="report-card">
                                        <div className="report-section">
                                            <h3 className="report-heading">Topic:</h3>
                                            <p className="report-text">{uploadResult?.topic || "No topic available"}</p>
                                        </div>

                                        <div className="report-section">
                                            <h3 className="report-heading">Summary</h3>
                                            <p className="report-text">{uploadResult?.summary || "No summary available"}</p>
                                        </div>

                                        <div className="report-section">
                                            <h3 className="report-heading">Document Threat Analysis Rating</h3>
                                            <p className="report-text">{uploadResult?.security_level || "No security analysis available"}</p>
                                        </div>

                                        <div className="report-section">
                                            <h3 className="report-heading">Concerning Language</h3>
                                            <div className="report-text">
                                                {uploadResult?.concerning_language && Array.isArray(uploadResult.concerning_language) && uploadResult.concerning_language.length > 0 ? (
                                                    <ul className="report-list">
                                                        {uploadResult.concerning_language.map((phrase, index) => (
                                                            <li key={index}>{phrase}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No concerning language found.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="report-section">
                                            <h3 className="report-heading">Questions to Ask</h3>
                                            <div className="report-text">
                                                {uploadResult?.questions && Array.isArray(uploadResult.questions) && uploadResult.questions.length > 0 ? (
                                                    <ul className="report-list">
                                                        {uploadResult.questions.map((question, index) => (
                                                            <li key={index}>{question}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>No questions to ask.</p>
                                                )}
                                            </div>
                                        </div>
                                        {currentUploadId && isAuthenticated && (
                                            <button
                                                type="button"
                                                className="download-pdf-btn"
                                                onClick={handleDownloadPDF}
                                            >
                                                ↓ Download PDF
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>

                    ) : (
                        <div className="error-message">
                            <p>No results available. Please try uploading again.</p>
                        </div>
                    )}

                    <div className="new-upload-container">
                        <button onClick={handleReset} className="uploadButton">
                            <FiFileText className="button-icon" />
                            Analyze Another Document
                        </button>
                    </div>

                </div>
            )}

            <DocumentChatWidget
                uploadId={currentUploadId}
                visible={!!uploadResult && !loading && isAuthenticated && !!currentUploadId}
                isOpen={chatOpen}
                onOpenChange={setChatOpen}
            />

            {isAuthenticated && (
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
                                        onClick={() => {
                                            setUploadResult(upload.analysis);
                                            setCurrentUploadId(upload._id);
                                            setUploadedFile(null);
                                            setFilePreviewUrl(null);
                                            setDocxPreviewHtml(null);
                                        }}
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
            )}
        </section>
    );
}

export default Upload;
