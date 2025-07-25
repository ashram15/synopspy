import React, { useEffect, useRef, useState } from 'react'
import report from './assets/report.png'
import './App.css'
import Typewriter from 'typewriter-effect'

const Features = () => {
    return (
        <>
            <section id="features">
                <div id="about">
                    <Typewriter options={{
                        strings: [
                            'Welcome to SynopSpy',
                            'Your AI-powered document summarization tool',
                            'Quickly summarize and analyze your complicating documents'
                        ],
                        autoStart: true,
                        loop: true,
                        delay: -20
                    }} />
                </div>

                <div id="demo">
                    <img src={report} alt="Demo of SynopSpy"></img>
                </div>
            </section>
        </>
    );
}

export default Features;