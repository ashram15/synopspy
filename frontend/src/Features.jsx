
import React from 'react';
import report from './assets/report.png';
import './App.css';
import './styles/modern.css';
import { Box, Typography, Grid } from '@mui/material';
import { FiZap, FiShield, FiCheckCircle } from 'react-icons/fi';

const Features = () => {
    return (
        <section id="features" style={{ background: '#f5f5f7' }}>
            <Box sx={{
                maxWidth: 1200,
                mx: 'auto',
                px: { xs: 2, md: 4 },
                py: { xs: 8, md: 12 }
            }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h2" sx={{ 
                        fontSize: { xs: '2rem', md: '3rem' },
                        fontWeight: 600,
                        color: '#1d1d1f',
                        mb: 2
                    }}>
                        Powerful features.
                    </Typography>
                    <Typography variant="body1" sx={{ 
                        fontSize: '1.25rem',
                        color: '#6e6e73',
                        maxWidth: 700,
                        mx: 'auto'
                    }}>
                        Everything you need to analyze documents with AI-powered precision.
                    </Typography>
                </Box>
                
                <Grid container spacing={4} sx={{ mb: 8 }}>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ mb: 2 }}>
                                <FiZap size={48} color="#00BF63" />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                                Instant Analysis
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Get comprehensive document analysis in seconds with our advanced AI engine.
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ mb: 2 }}>
                                <FiShield size={48} color="#0071e3" />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                                Security First
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Automatic detection of security concerns and sensitive information.
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ mb: 2 }}>
                                <FiCheckCircle size={48} color="#00BF63" />
                            </Box>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#1d1d1f', mb: 1.5 }}>
                                Smart Insights
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Extract key topics, summaries, and questions automatically.
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ 
                    maxWidth: 900,
                    mx: 'auto',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                }}>
                    <img
                        src={report}
                        alt="Demo of SynopSpy"
                        style={{
                            width: '100%',
                            display: 'block'
                        }}
                    />
                </Box>
            </Box>
        </section>
    );
}

export default Features;