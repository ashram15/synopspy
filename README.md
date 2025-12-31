# SynopSpy: Free Document Summarizer with Legal Risk Analysis 
SynopSpy is a full stack web application that help users understand and assess complex
documents. Some examples of documents SynopSpy helps analyze are legal fine print, court documents, or terms and conditions. SynopSpy uses NLP(Natural Language Processing) to summarize and analyze these documents, flag risky language, and assign a document safety rating.

📝<strong>Note:</strong> Synopspy is hosted on Render's free-tier. Render's server may go to sleep after a period of inactivity. Thus, <strong>the first request on Synopspy might take 1-2 minutes to load</strong> as Render's server wakes up. <strong>The subsequent requests will be much faster!</strong>

## Live Application: https://synopspy.onrender.com
![synopspy_demo.gif](frontend/src/assets/synopspy_demo.gif)

## Key Features
- <strong>AI-Powered Summarization and Risk Analysis:</strong> Leverages <strong>Google's Gemini API </strong> to perform complex NLP tasks, including large document summarization and content risk analysis. Detects complex legal language and highlights sections in the document that require increased oversight. 
- <strong>Dynamic Safety Rating:</strong> processes AI output and generates a 1-5 safety score, providing users with a quick understanding of document risk.
- <strong>User Authentication</strong>: Integrates a secure login using <strong>Auth0</strong> to ensure that document uploads are tied to individual users. 
- <strong>Upload History:</strong> Stores and retrieves a user's previous document analysis using <strong>MongoDB</strong>, allowing for easy comparison and review. 

## Process 
- Developed a RESTful API with FastAPI, connected to a React frontend via JavaScript. 
- User authentication handled via Auth0
- Uploaded documents are processed using PyMuPDF and python-docx, analyzed with Google Gemeni API. 
- MongoDB stores user-specific upload history

## Technologies 
- <strong>Frontend:</strong> React, Javascript 
- <strong>Backend:</strong> FastAPI, Python
- <strong>Authentication:</strong> Auth0
- <strong>Database:</strong> MongoDB
- <strong>API-Communication: </strong>Custom built RESTful API handles all data exchanges between frontend and backend. CORS is used to allow cross-origin requests. 
- <strong>File Processing:</strong> PyMuPDF, python-docx Libraries
- <strong>AI-Model:</strong> Google Gemini 

## Key Design Decisions
- Fast API
* Chosen for its asynchronous capabilities and high performance when handling multiple file uploads concurrently 
* Minimal boilerplate code compared to Flask/Django for REST APIs 
- Mongo DB
* JSON-like format integrates seamlessly with React/JS frontend 
* Scales well for user-specific document queries 
* Flexible schema allows for easy iteration on stored document metadata 
- Why Gemini 
* Free tier with generous quote limits
* Multi-modal capabilities (Synopspy may extend to analyzing image/pdf analysis in future) 
* Lower latency 

## Future Improvements 
* **Email Notifications:** sending alerts when high-risk documents are detected 
* **Collaborative Features:** sharing document analyses with friends, lawyers, or team members 
* **Export Options:** Enable PDF/CSV export of analysis results 
* **Custom Risk Categories:** allow users to define custom risk keywords/phrases for Synopspy to flag. 
* **Mobile Responsiveness:** optimize UI for mobile devices 

<!-- ## How to Run Locally:   
- To run the program, run both the <strong>React</strong> frontend and the <strong>FastAPI</strong> backend code simultaneously.   
1. First navigate to the project root    
    ```cd synopspy-project```  
2. Start the frontend    
    ```cd frontend ```  
    ```npm install ```  
    ```npm run dev```  
3. Start the backend on localhost:8000:  
    ```cd backend</code>```  
    - Create and activate venv  
        ```python -m venv .venv```  
        ```source .venv/bin/activate```
    - Install Requirements   
        ```pip install -r requirements.txt```
    - Run Backend:  
        ```uvicorn app:app --reload</code>```  
<strong>The Frontend should now be running on <code>localhost:5173</code> and the backend on <code>localhost:8000</code></strong> -->
<!-- 4. Access the App
    - Go to browser and access frontend through <code>localhost:5173</code> -->









