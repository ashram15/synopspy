
import React from 'react';
import report from './assets/report.png';
import './App.css';
import './styles/modern.css';
import { Box, Typography } from '@mui/material';
import { FiZap, FiShield, FiCheckCircle } from 'react-icons/fi';

const Features = () => {
    return (
        <section id="features" style={{ background: '#EBF9D9' }}>
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

                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'stretch', md: 'center' },
                        justifyContent: 'space-between',
                        gap: { xs: 3, md: 4 },
                        mb: 8,
                    }}
                >
                    {[
                        {
                            icon: <FiZap size={44} color="#00BF63" aria-hidden />,
                            title: 'Instant Analysis',
                            body: 'Get comprehensive document analysis in seconds with our advanced AI engine.',
                        },
                        {
                            icon: <FiShield size={44} color="#0071e3" aria-hidden />,
                            title: 'Security First',
                            body: 'Automatic detection of security concerns and sensitive information.',
                        },
                        {
                            icon: <FiCheckCircle size={44} color="#00BF63" aria-hidden />,
                            title: 'Smart Insights',
                            body: 'Extract key topics, summaries, and questions automatically.',
                        },
                    ].map(({ icon, title, body }) => (
                        <Box
                            key={title}
                            sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 2,
                                flex: { md: '1 1 0' },
                                minWidth: 0,
                                textAlign: 'left',
                            }}
                        >
                            <Box
                                sx={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 44,
                                    height: 44,
                                }}
                            >
                                {icon}
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography
                                    component="h3"
                                    variant="h5"
                                    sx={{ fontWeight: 600, color: '#1d1d1f', mb: 0.5, lineHeight: 1.25 }}
                                >
                                    {title}
                                </Typography>
                                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                    {body}
                                </Typography>
                            </Box>
                        </Box>
                    ))}
                </Box>

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