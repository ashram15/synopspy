
import React, { useEffect, useState } from 'react';
import './App.css';
import './styles/modern.css';
import pdfIcon from './assets/pdf.png';
import docxIcon from './assets/docx.png';
import loadImg from './assets/animation.gif';
import { useAuth0 } from "@auth0/auth0-react";
import { FiUpload, FiFileText, FiAward, FiShield, FiAlertCircle, FiHelpCircle } from 'react-icons/fi';
import { Card, CardContent, Typography, Button, Box, CircularProgress, TextField, List, ListItem, ListItemIcon, ListItemText, Divider, Paper, Avatar, Stack } from '@mui/material';

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
                <Box sx={{ 
                    maxWidth: 800, 
                    mx: 'auto', 
                    px: { xs: 2, md: 4 },
                    py: { xs: 8, md: 12 },
                    textAlign: 'center'
                }}>
                    <Typography variant="h2" sx={{ 
                        fontSize: { xs: '2rem', md: '3rem' },
                        fontWeight: 600,
                        color: '#1d1d1f',
                        mb: 2
                    }}>
                        Upload your document
                    </Typography>
                    <Typography variant="body1" sx={{ 
                        fontSize: '1.25rem',
                        color: '#6e6e73',
                        mb: 5
                    }}>
                        Get instant AI-powered analysis
                    </Typography>
                    <Box sx={{ 
                        border: '2px dashed #d2d2d7',
                        borderRadius: 3,
                        p: 6,
                        mb: 4,
                        bgcolor: '#fbfbfd',
                        transition: 'all 0.3s',
                        '&:hover': { borderColor: '#0071e3', bgcolor: '#f5f5f7' }
                    }}>
                        <FiUpload size={48} color="#6e6e73" style={{ marginBottom: 16 }} />
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                            Drag and drop your file here
                        </Typography>
                        <input 
                            type="file" 
                            accept=".pdf, .doc, .docx" 
                            className="file-input" 
                            style={{ 
                                display: 'block',
                                margin: '0 auto',
                                padding: '12px',
                                fontSize: '1rem',
                                maxWidth: 400
                            }} 
                        />
                    </Box>
                    <Button 
                        onClick={handleFileUpload} 
                        variant="contained" 
                        sx={{ 
                            bgcolor: '#0071e3',
                            color: '#fff',
                            px: 4,
                            py: 1.5,
                            fontSize: '1.0625rem',
                            fontWeight: 400,
                            borderRadius: 980,
                            '&:hover': { bgcolor: '#0077ed' }
                        }}
                    >
                        Analyze Document
                    </Button>
                </Box>
            ) : loading ? (
                <Box sx={{ 
                    maxWidth: 800, 
                    mx: 'auto', 
                    px: { xs: 2, md: 4 },
                    py: { xs: 12, md: 16 },
                    textAlign: 'center',
                    minHeight: '60vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img src={loadImg} alt="Loading..." style={{ width: 140, marginBottom: 32 }} />
                    <Typography variant="h3" sx={{ color: '#1d1d1f', fontWeight: 600, mb: 2 }}>Analyzing...</Typography>
                    <CircularProgress size={32} sx={{ color: '#0071e3' }} />
                </Box>
            ) : (
                <Box sx={{ 
                    maxWidth: 900, 
                    mx: 'auto', 
                    px: { xs: 2, md: 4 },
                    py: { xs: 8, md: 12 }
                }}>
                    <Typography variant="h2" sx={{ 
                        fontSize: { xs: '2rem', md: '3rem' },
                        fontWeight: 600,
                        color: '#1d1d1f',
                        mb: 6,
                        textAlign: 'center'
                    }}>
                        Analysis Results
                    </Typography>
                        <Stack spacing={4}>
                            <Box sx={{ 
                                p: 4, 
                                bgcolor: '#f5f5f7', 
                                borderRadius: 3
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiAward /> Topic
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.0625rem', color: '#6e6e73' }}>{uploadResult["topic"]}</Typography>
                            </Box>
                            <Box sx={{ 
                                p: 4, 
                                bgcolor: '#f5f5f7', 
                                borderRadius: 3
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiFileText /> Summary
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.0625rem', color: '#6e6e73', lineHeight: 1.6 }}>{uploadResult["summary"]}</Typography>
                            </Box>
                            <Box sx={{ 
                                p: 4, 
                                bgcolor: '#f5f5f7', 
                                borderRadius: 3
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiShield /> Security Analysis
                                </Typography>
                                <Typography variant="body1" sx={{ fontSize: '1.0625rem', color: '#6e6e73' }}>{uploadResult["security_level"]}</Typography>
                            </Box>
                            <Box sx={{ 
                                p: 4, 
                                bgcolor: '#f5f5f7', 
                                borderRadius: 3
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiAlertCircle /> Concerning Language
                                </Typography>
                                <List dense>
                                    {uploadResult["concerning_language"].length > 0 ? (
                                        uploadResult["concerning_language"].map((phrase, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon><FiAlertCircle color="#e57373" /></ListItemIcon>
                                                <ListItemText primary={phrase} />
                                            </ListItem>
                                        ))
                                    ) : (
                                        <ListItem>
                                            <ListItemText primary="No concerning language found." />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                            <Box sx={{ 
                                p: 4, 
                                bgcolor: '#f5f5f7', 
                                borderRadius: 3
                            }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FiHelpCircle /> Questions to Consider
                                </Typography>
                                <List dense>
                                    {uploadResult["questions"].length > 0 ? (
                                        uploadResult["questions"].map((question, index) => (
                                            <ListItem key={index}>
                                                <ListItemIcon><FiHelpCircle color="#64b5f6" /></ListItemIcon>
                                                <ListItemText primary={question} />
                                            </ListItem>
                                        ))
                                    ) : (
                                        <ListItem>
                                            <ListItemText primary="No questions to ask." />
                                        </ListItem>
                                    )}
                                </List>
                            </Box>
                        </Stack>
                        <Divider sx={{ my: 3 }} />
                        <Stack direction="row" spacing={2} justifyContent="center">
                            <Button onClick={() => setUploadResult(null)} variant="outlined" color="primary" startIcon={<FiUpload />} sx={{ borderRadius: 3 }}>
                                Synopsize Another Document
                            </Button>
                        </Stack>
                    <Box sx={{ textAlign: 'center', mt: 6 }}>
                        <Button 
                            onClick={() => setUploadResult(null)} 
                            variant="contained" 
                            sx={{ 
                                bgcolor: '#0071e3',
                                color: '#fff',
                                px: 4,
                                py: 1.5,
                                fontSize: '1.0625rem',
                                fontWeight: 400,
                                borderRadius: 980,
                                '&:hover': { bgcolor: '#0077ed' }
                            }}
                        >
                            Analyze Another Document
                        </Button>
                    </Box>
                </Box>
            )}

            {pastUploads.length > 0 && (
                <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 4, textAlign: 'center' }}>
                        Past Uploads
                    </Typography>
                    {pastUploads.length === 0 ? (
                        <Typography color="text.secondary">No past uploads</Typography>
                    ) : (
                        <List>
                            {pastUploads.map((upload, index) => {
                                let icon = upload.filename.toLowerCase().endsWith('.pdf') ? pdfIcon : docxIcon;
                                return (
                                    <ListItem
                                        button
                                        key={upload._id || index}
                                        onClick={() => setUploadResult(upload.analysis)}
                                        sx={{ borderRadius: 2, mb: 1 }}
                                    >
                                        <Avatar src={icon} alt={upload.filename.split('.').pop()} sx={{ width: 32, height: 32, mr: 2 }} />
                                        <ListItemText
                                            primary={upload.filename}
                                            secondary={new Date(upload.timestamp).toLocaleDateString()}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>
            )}
        </section>
    );
}

export default Upload;
