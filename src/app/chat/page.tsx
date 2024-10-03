"use client";

import { ModeToggle } from "@/components/dark-mode-toggle";
// import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../globals.css'; // Import the CSS file
import SideNavBar from '@/components/sidebar/sidenav';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import * as DOMPurify from 'dompurify';

import {
  PanelResizeHandle,
  Panel,
  PanelGroup,
} from "react-resizable-panels"
import { FlipVertical } from "lucide-react";

// Main functional component for the page
const Page2 = () => {
  // State variables to hold various form data and feedback
  const [learningOutcome, setLearningOutcome] = useState('');
  const [markingCriteria, setMarkingCriteria] = useState('');
  const [studentWriting, setStudentWriting] = useState('');
  const [feedback, setFeedback] = useState('');
  const [processedContent, setProcessedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sanitizedContent, setSanitizedContent] = useState(processedContent);

  // useEffect hook to initialize tooltips whenever the processedContent changes
  useEffect(() => {
    // Dynamic import for DOMPurify to ensure it's only loaded on the client-side
    import('dompurify').then((DOMPurify) => {
      const sanitized = DOMPurify.default.sanitize(processedContent);
      setSanitizedContent(sanitized);
    });
  }, [processedContent]);

  // Function to handle changes in the editor and update the state
  const handleEditorChange = (content: string) => {
    setStudentWriting(content);
  };

  // Function to extract original texts and improvements from the feedback
  // and highlight those texts in the student writing content.
  const extractFeedback = (feedback: string, studentWriting: string) => {
    // Regular expressions to extract Original Texts and Improvements separately using the custom delimiters
    const originalTextRegex = /\*\*Original Text:\*\*\s*"([^"]+)"\s*<endoforiginal>/gi;
    const improvementRegex = /\*\*Improvement:\*\*\s*([\s\S]*?)<endofimprovement>/g;

    const originals = [];
    const improvements = [];

    let matchOriginal;
    let matchImprovement;

    // Extract all Original Texts
    while ((matchOriginal = originalTextRegex.exec(feedback)) !== null) {
      originals.push(matchOriginal[1]);
    }

    // Extract all Improvements
    while ((matchImprovement = improvementRegex.exec(feedback)) !== null) {
      console.log("Improvement Found: ", matchImprovement[1]);
      improvements.push(matchImprovement[1].trim());
    }

    console.log("Originals: ", originals);
    console.log("Improvements: ", improvements);

    // Ensure that the number of originals and improvements are the same to maintain consistent replacements
    const minLength = Math.min(originals.length, improvements.length);

    let processedContent = studentWriting;

    for (let i = 0; i < minLength; i++) {
      const originalText = originals[i];
      const improvementText = improvements[i];

      console.log(`Replacing: ${originalText} with improvement: ${improvementText}`);

      // Escape special characters in the original text for use in the regex
      const escapedText = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // Create a regex to find all instances of the original text in the student writing
      const regex = new RegExp(escapedText, 'gi');

      // Replace the original text with a highlighted version that includes the improvement as a tooltip
      processedContent = processedContent.replace(
        regex,
        `<span class="highlight-button" data-y-content="${improvementText}">$&</span>`
      );
    }
    console.log("Processed Content: ", processedContent);
    return processedContent;
  };

  // Function to handle the submission, sending the user input to the backend API, 
  // and then process the returned feedback to display in the UI.
  const handleSubmit = async () => {
    setLoading(true);  // Set loading to true when the request starts
    setFeedback('');   // Reset feedback before making a new request

    // Send a POST request to the backend with the user inputs
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learningOutcome,
        markingCriteria,
        studentWriting,
      }),
    });

    if (response.ok) {
      // If response is successful, process the data
      const data = await response.json();

      // Call the extractFeedback function to integrate feedback into the student writing
      const processedContent = extractFeedback(data.message || 'No feedback received.', studentWriting);

      // Update the processedContent state
      setProcessedContent(processedContent);

      // Clean up feedback for display purposes by removing the delimiters and extra text
      const feedbackCleaned = data.message
        .replace(/\*\*Original Text:\*\*\s*"([^"]+)"\s*<endoforiginal>/gi, '')
        .replace(/\*\*Improvement:\*\*\s*[\s\S]*?<endofimprovement>/g, '');
      setFeedback(feedbackCleaned.trim());
    } else {
      setFeedback('Error: Unable to get feedback.');  // Error handling for failed requests
    }
    setLoading(false);  // Set loading to false once request completes
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <span className="logo-text">"We are Learners"</span>
        </div>
      </header>

    <div className="open-sidenav-button-container">
      <SideNavBar />
    </div>
    <PanelGroup direction="horizontal" className="resizable-group" style={{ height: '100%', overflowY: 'auto' }}>
      {/* Left Panel: Learning Outcome and Marking Criteria */}
      <Panel className="left-panel" style={{ height: '100%', overflowY: 'auto' }}>
        <div className="left-column" style={{ height: '100%', overflowY: 'auto' }}>
              <h2 style={{ marginLeft: '20px' }}>Learning Outcome</h2>
              <textarea
                value={learningOutcome}
                onChange={(e) => setLearningOutcome(e.target.value)}
                rows="10"
                className="textarea"
                style={{ width: '100%', height: '200px', overflowY: 'auto' }}
              />
            </div>

          {/* Marking Criteria Panel */}
            <div className="left-column" style={{ height: '100%', overflowY: 'auto' }}>
              <h2 style={{ marginLeft: '20px' }}>Marking Criteria</h2>
              <textarea
                value={markingCriteria}
                onChange={(e) => setMarkingCriteria(e.target.value)}
                rows="10"
                className="textarea"
                style={{ width: '100%', height: '200px', overflowY: 'auto' }}
              />
            </div>
      </Panel>

      <PanelResizeHandle />

      {/* Right Panel: Student Writing */}
      <Panel className="right-panel" style={{ height: '100%', overflowY: 'auto' }}>
        <div className="right-column" style={{ height: '100%', overflowY: 'auto' }}>
          <h2 style={{ marginLeft: '20px' }}>Student Writing</h2>
          <div
            className="student-writing-box"
            contentEditable={true}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            onInput={(e) => setStudentWriting(e.currentTarget.innerHTML)}
            style={{ border: '1px solid #ccc', padding: '20px', height: '100%', overflowY: 'auto' }}
          ></div>
        </div>
      </Panel>
    </PanelGroup>
  <div className="button-container" style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #ccc' }}>
        <button onClick={handleSubmit} className="submit-button">Get Feedback</button>
      </div>
    {/* Display generated feedback in markdown format */}
    <div className="markdown-body">
        {loading && <div className="loading" >Generating feedback...</div>}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
      </div>
    </div>
  );
};

export default Page2;