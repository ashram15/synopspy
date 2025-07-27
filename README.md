# SynopSpy: Free Document Analyzer with Legal Risk Insights 
SynopSpy is a full stack web application that help users understand and assess complex
documents. Some examples of documents SynopSpy helps analyze are complicating homework assignments, legal fine print, court documents, or terms and conditions. SynopSpy uses NLP(Natural Language Processing) to summarize and analyze these documents, flag risky language, and assign a document safety rating. 

## Live Application: https://synopspy.onrender.com

## Features
- <strong>Document Summarizer:</strong> summarizes content of the document in a short response. 
- <strong>Threat Analysis and Safety Rating:</strong> outputs a rating from 1 to 5 indicating the safety of the document. This feature only applies if the document carries legal importance (ie. court document, terms and condition, license)
- <strong>Upload History:</strong> user can access their past uploads analysis by clicking on their uploaded document. 
- <strong>AI-powered Legal NLP</strong>: Uses the Gemini API to detect complex legal language and highlight sections of the document that require increased oversight. 

## Process 
- Built RESTful API
- Integrates a React framework with a FastAPI/Python backend
- Involves NLP model integration in the stack to process user upload and analyze data. 

## Technologies 
- <strong>Frontend:</strong> React, Javascript 
- <strong>Backend:</strong> FastAPI, Python
- <strong>File Uploads/Parsing:</strong> PyMuPDF, python-docx Libraries
- <strong>Utilizes CORS to enable cross-origin requests between the frontend (React) and backend (FastAPI). All data exchanges between frontend and backend is handled via a RESTful API</strong>
- <strong>Model:</strong> Gemini API 

## How it works
1. User uploads a document (PDF or DOCX/DOC)
2. Frontend makes a POST request to the FastAPI backend (using fetch) with the document included. 
3. Backend receives the file and extracts the plain text from the document 
4. An API call is made to Gemini AI 
5. AI analyzes text for: 
    - Summary
    - Concerning Language indicating security risks
    - Legal Complexity 
    - Safety Score 
6. Backend cleans up AI response and sends result as a JSON object to frontend. 
4. Frontend waits for result, parses data from JSON object, and displays SynopSpy report to user. 




