"use client";

import { useState, useEffect, useMemo } from "react";
import SelectMenu from '@/components/select-menu/selectmenu';
import { SubjectOptions, Biology, History, SubjectOption } from '@/components/select-menu/data';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { Container, Flex, Heading } from "@radix-ui/themes";
import styles from "./page.module.css";
import { CaretRightIcon, CaretLeftIcon } from "@radix-ui/react-icons";
import React from "react";

interface Question {
  id: number;
  questionText: string;
  markingCriteria?: string | null;
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  date: string;
  updatedAt: string;
  questions: Question[];
}

interface Assignment {
  id: number;
  title: string;
  subject: string;
  learningOutcomes: string;
  markingCriteria: string;
  additionalPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export default function AssignmentListPage() {
  const [viewMode, setViewMode] = useState<'assignments' | 'exams'>('assignments');
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  // Shared messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // State for adding/editing assignments
  const [showForm, setShowForm] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [learningOutcomes, setLearningOutcomes] = useState("");
  const [markingCriteria, setMarkingCriteria] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<SubjectOption | null>(null);

  // State for adding/editing exams
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [examQuestions, setExamQuestions] = useState("");
  const [examErrorMessage, setExamErrorMessage] = useState<string | null>(null);
  const [examSuccessMessage, setExamSuccessMessage] = useState<string | null>(null);
  const [showExamEditForm, setShowExamEditForm] = useState(false);

  const [scrollStates, setScrollStates] = useState<{ [subject: string]: { showScrollButtons: boolean } }>({});

  // Fetch assignments on mount
  useEffect(() => {
    fetch("/api/assignment")
      .then((res) => res.json())
      .then((data) => setAssignments(data))
      .catch((err) => console.error("Error fetching assignments", err));
  }, []);

  // Fetch exams when in exam view
  useEffect(() => {
    if (viewMode === 'exams') {
      fetch("/api/exams")
        .then((res) => res.json())
        .then((data: Exam[]) => setExams(data))
        .catch((err) => console.error("Error fetching exams", err));
    }
  }, [viewMode]);

  const groupedAssignments = useMemo(() => {
    if (!Array.isArray(assignments)) return {};
    return assignments.reduce((acc, assignment) => {
      const subj = assignment.subject;
      if (!acc[subj]) acc[subj] = [];
      acc[subj].push(assignment);
      return acc;
    }, {} as { [key: string]: Assignment[] });
  }, [assignments]);

  const groupedExams = useMemo(() => {
    if (!Array.isArray(exams)) return {};
    return exams.reduce((acc, exam) => {
      const subj = exam.subject;
      if (!acc[subj]) acc[subj] = [];
      acc[subj].push(exam);
      return acc;
    }, {} as { [key: string]: Exam[] });
  }, [exams]);

  const rowRefs = useMemo(() => {
    const refs: { [subject: string]: React.RefObject<HTMLDivElement> } = {};
    const keys = viewMode === 'assignments' 
      ? Object.keys(groupedAssignments) 
      : Object.keys(groupedExams);
    for (const subj of keys) {
      refs[subj] = React.createRef<HTMLDivElement>();
    }
    return refs;
  }, [groupedAssignments, groupedExams, viewMode]);

  useEffect(() => {
    const newScrollStates: { [subject: string]: { showScrollButtons: boolean } } = {};
    const keys = viewMode === 'assignments' 
      ? Object.keys(groupedAssignments) 
      : Object.keys(groupedExams);

    for (const subj of keys) {
      const element = rowRefs[subj].current;
      if (element) {
        const overflow = element.scrollWidth > element.clientWidth;
        newScrollStates[subj] = { showScrollButtons: overflow };
      }
    }
    setScrollStates(newScrollStates);
  }, [assignments, exams, groupedAssignments, groupedExams, rowRefs, viewMode]);

  const mentionData: SuggestionDataItem[] = [
    { id: 'biology-prompt', display: 'biology-prompt' },
    { id: 'history-prompt', display: 'history-prompt' },
  ];

  const handleSubjectChange = (selectedOption: SubjectOption | null) => {
    if (
      subject === 'Custom' &&
      selectedOption &&
      selectedOption.value !== 'Custom'
    ) {
      const confirmChange = window.confirm(
        'Changing the subject will reset your additional prompt. Do you want to proceed?'
      );
      if (!confirmChange) return;
      setAdditionalPrompt('');
    }

    setSelectedSubject(selectedOption);
    setSubject(selectedOption ? selectedOption.value : '');

    if (selectedOption) {
      if (selectedOption.value === 'Biology') {
        setAdditionalPrompt(`@[biology-prompt](biology-prompt)`);
      } else if (selectedOption.value === 'History') {
        setAdditionalPrompt(`@[history-prompt](history-prompt)`);
      } else if (selectedOption.value === 'Custom') {
        setAdditionalPrompt('');
      }
    } else {
      setAdditionalPrompt('');
    }
  };

  const renderMentions = (text: string) => {
    const regex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = regex.lastIndex;
      if (start > lastIndex) {
        parts.push(text.substring(lastIndex, start));
      }
      parts.push(
        <span key={start} className="mentions__mention">
          {match[1]}
        </span>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts;
  };

  const scrollLeft = (subj: string) => {
    const ref = rowRefs[subj].current;
    if (ref) {
      ref.scrollBy({ top: 0, left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = (subj: string) => {
    const ref = rowRefs[subj].current;
    if (ref) {
      ref.scrollBy({ top: 0, left: 300, behavior: 'smooth' });
    }
  };

  // ONE FUNCTION TO HANDLE EDIT
  // This sets the appropriate form states based on whether it's an assignment or an exam
  function handleEditItem(type: "assignment" | "exam", item: Assignment | Exam) {
    if (type === "assignment") {
      const assignment = item as Assignment;
      setTitle(assignment.title);
      setSubject(assignment.subject);
      setLearningOutcomes(assignment.learningOutcomes);
      setMarkingCriteria(assignment.markingCriteria);
      setAdditionalPrompt(assignment.additionalPrompt);
      setEditingAssignmentId(assignment.id);
      setShowForm(true);

      const selectedOption = SubjectOptions.find(option => option.value === assignment.subject);
      setSelectedSubject(selectedOption || null);
    } else {
      const exam = item as Exam;
      setExamTitle(exam.title);
      setExamSubject(exam.subject);
      setExamDate(exam.date);
      setEditingExamId(exam.id);
      setShowExamEditForm(true);
    }
  }

  // ONE FUNCTION TO HANDLE DELETE
  // This function deletes either an assignment or an exam and updates the relevant state.
  async function handleDeleteItem(
    type: "assignment" | "exam",
    id: number
  ) {
    try {
      const endpoint = type === "assignment" ? "/api/assignment" : "/api/exams";
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (type === "assignment") {
          setAssignments(assignments.filter(a => a.id !== id));
          setSuccessMessage("Assignment deleted successfully!");
        } else {
          setExams(exams.filter(e => e.id !== id));
          setSuccessMessage("Exam deleted successfully!");
        }
      } else {
        setErrorMessage(`Failed to delete ${type}`);
      }
    } catch (error) {
      setErrorMessage(`An error occurred while deleting the ${type}`);
    }
  }

  // Functions for handling assignment submission (as before)
  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !learningOutcomes || !markingCriteria) {
      setErrorMessage("Please fill in all fields");
      return;
    }

    if (
      selectedSubject?.value === 'Custom' &&
      /@\[([^\]]+)\]\(([^)]+)\)/g.test(additionalPrompt)
    ) {
      alert('Using custom prompt with tags might create issues.');
    }

    if (selectedSubject?.value === 'Biology' && additionalPrompt.trim() !== '@[biology-prompt](biology-prompt)') {
      alert('For Biology subject, the Additional Prompt should contain only the biology-prompt tag.');
      return;
    }

    if (selectedSubject?.value === 'History' && additionalPrompt.trim() !== '@[history-prompt](history-prompt)') {
      alert('For History subject, the Additional Prompt should contain only the history-prompt tag.');
      return;
    }

    try {
      const url = editingAssignmentId ? `/api/assignment/${editingAssignmentId}` : "/api/assignment";
      const method = editingAssignmentId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          subject,
          learningOutcomes,
          markingCriteria,
          additionalPrompt,
        }),
      });

      if (response.ok) {
        const savedAssignment = await response.json();
        if (editingAssignmentId) {
          setAssignments(assignments.map((a) => a.id === editingAssignmentId ? savedAssignment : a));
          setSuccessMessage("Assignment updated successfully!");
        } else {
          setAssignments([...assignments, savedAssignment]);
          setSuccessMessage("Assignment added successfully!");
        }
        resetAssignmentForm();
      } else {
        setErrorMessage("Failed to save assignment");
      }
    } catch (error) {
      setErrorMessage("An error occurred while saving the assignment");
    }
  };

  const resetAssignmentForm = () => {
    setTitle("");
    setSubject("");
    setLearningOutcomes("");
    setMarkingCriteria("");
    setAdditionalPrompt("");
    setEditingAssignmentId(null);
    setErrorMessage(null);
    setShowForm(false);
    setSelectedSubject(null);
  };

  const handleAddAssignment = () => {
    resetAssignmentForm();
    setShowForm(true);
  };

  // Exam creation as before
  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examSubject || !examDate) {
      setExamErrorMessage("Please fill in all fields for the exam");
      return;
    }

    let questionsArray: { questionText: string, markingCriteria?: string }[] = [];
    const lines = examQuestions.split("\n").filter(line => line.trim() !== "");
    for (const line of lines) {
      const parts = line.split("|").map(part => part.trim());
      const qText = parts[0];
      const qCriteria = parts[1] || "";
      if (!qText) continue;
      questionsArray.push({ questionText: qText, markingCriteria: qCriteria });
    }

    try {
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          subject: examSubject,
          date: examDate,
          questions: questionsArray,
        }),
      });
      if (response.ok) {
        const newExam = await response.json();
        setExams([...exams, newExam]);
        setExamSuccessMessage("Exam added successfully!");
        setExamTitle("");
        setExamSubject("");
        setExamDate("");
        setExamQuestions("");
        setExamErrorMessage(null);
        setShowExamForm(false);
      } else {
        setExamErrorMessage("Failed to add exam");
      }
    } catch (error) {
      console.error(error);
      setExamErrorMessage("An error occurred while adding the exam");
    }
  };

  // Updating an exam after editing form submission (similar logic as assignments)
  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExamId) return;

    try {
      const response = await fetch(`/api/exams/${editingExamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          subject: examSubject,
          date: examDate,
        }),
      });

      if (response.ok) {
        const updatedExam = await response.json();
        setExams(exams.map(e => e.id === editingExamId ? updatedExam : e));
        setSuccessMessage("Exam updated successfully!");
        resetExamForm();
      } else {
        setErrorMessage("Failed to update exam");
      }
    } catch (error) {
      setErrorMessage("An error occurred while updating the exam");
    }
  };

  const resetExamForm = () => {
    setEditingExamId(null);
    setShowExamEditForm(false);
    setExamTitle("");
    setExamSubject("");
    setExamDate("");
    setExamErrorMessage(null);
    setExamSuccessMessage(null);
  };

  function AssignmentCard({ assignment }: { assignment: Assignment }) {
    return (
      <div className={styles.assignmentCard}>
        <div className={styles.customCard}>
          <div className={styles.customAvatar}>
            {assignment.subject[0] || "A"}
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{assignment.title}</div>
            <div className={styles.cardSubtitle}>
              Updated {new Date(assignment.updatedAt).toDateString()}
            </div>
          </div>
          <div className={styles.cardActions}>
            <button
              onClick={() => handleEditItem("assignment", assignment)}
              className={styles.editButton}
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteItem("assignment", assignment.id)}
              className={styles.deleteButton}
            >
              Delete
            </button>
            <a
              className={styles.assignmentsLink}
              href={`/admin/assignment/${assignment.id}`}
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    );
  }

  function ExamCard({ exam }: { exam: Exam }) {
    return (
      <div className={styles.assignmentCard}>
        <div className={styles.customCard}>
          <div className={styles.customAvatar}>
            {exam.subject[0] || "E"}
          </div>
          <div className={styles.cardContent}>
            <div className={styles.cardTitle}>{exam.title}</div>
            <div className={styles.cardSubtitle}>
              Exam Date: {new Date(exam.date).toDateString()}
            </div>
            <div className={styles.cardSubtitle}>
              Questions: {exam.questions?.length || 0}
            </div>
          </div>
          <div className={styles.cardActions}>
            <button
              onClick={() => handleEditItem("exam", exam)}
              className={styles.editButton}
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteItem("exam", exam.id)}
              className={styles.deleteButton}
            >
              Delete
            </button>
            <a
              className={styles.assignmentsLink}
              href={`/admin/UploadCSV?examId=${exam.id}`}
            >
              View Details
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assignment-page">
      <div className="assignment-container">
        {!showForm && !showExamForm && !showExamEditForm ? (
          <div className="assignment-list">
            <Container className="p-8">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <button 
                  className="toggle-button"
                  onClick={() => setViewMode('assignments')}
                  style={{ fontWeight: viewMode === 'assignments' ? 'bold' : 'normal' }}
                >
                  Assignment List
                </button>
                <button 
                  className="toggle-button"
                  onClick={() => setViewMode('exams')}
                  style={{ fontWeight: viewMode === 'exams' ? 'bold' : 'normal' }}
                >
                  Exams
                </button>
              </div>

              {viewMode === 'assignments' && (
                <>
                  {Object.entries(groupedAssignments).map(([subj, subjectAssignments]) => {
                    const { showScrollButtons = false } = scrollStates[subj] || {};
                    return (
                      <div key={subj} className={styles.subjectSection}>
                        <Heading as="h2" size="5" className={styles.subjectHeading}>{subj}</Heading>
                        <div className={styles.cardRowContainer}>
                          {showScrollButtons && (
                            <button 
                              className={styles.scrollButtonLeft} 
                              onClick={() => scrollLeft(subj)}
                              aria-label="Scroll left"
                            >
                              <CaretLeftIcon />
                            </button>
                          )}
                          <Flex className={styles.cardRow} ref={rowRefs[subj]}>
                            {subjectAssignments.map((assignment) => (
                              <AssignmentCard key={assignment.id} assignment={assignment} />
                            ))}
                          </Flex>
                          {showScrollButtons && (
                            <button 
                              className={styles.scrollButtonRight} 
                              onClick={() => scrollRight(subj)}
                              aria-label="Scroll right"
                            >
                              <CaretRightIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={handleAddAssignment} className="add-button">
                    Add New Assignment
                  </button>
                </>
              )}

              {viewMode === 'exams' && (
                <>
                  {Object.entries(groupedExams).map(([subj, subjectExams]) => {
                    const { showScrollButtons = false } = scrollStates[subj] || {};
                    return (
                      <div key={subj} className={styles.subjectSection}>
                        <Heading as="h2" size="5" className={styles.subjectHeading}>{subj}</Heading>
                        <div className={styles.cardRowContainer}>
                          {showScrollButtons && (
                            <button 
                              className={styles.scrollButtonLeft} 
                              onClick={() => scrollLeft(subj)}
                              aria-label="Scroll left"
                            >
                              <CaretLeftIcon />
                            </button>
                          )}
                          <Flex className={styles.cardRow} ref={rowRefs[subj]}>
                            {subjectExams.map((exam) => (
                              <ExamCard key={exam.id} exam={exam} />
                            ))}
                          </Flex>
                          {showScrollButtons && (
                            <button 
                              className={styles.scrollButtonRight} 
                              onClick={() => scrollRight(subj)}
                              aria-label="Scroll right"
                            >
                              <CaretRightIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* BUTTON TO ADD NEW EXAM */}
                  <button onClick={() => setShowExamForm(true)} className="add-button">
                    Add New Exam
                  </button>
                </>
              )}
            </Container>
          </div>
        ) : null}

        {/* FORM FOR ADDING/EDITING ASSIGNMENT */}
        {showForm && !showExamForm && !showExamEditForm && (
          <div className="assignment-form">
            <h3>
              {editingAssignmentId ? "Edit Assignment" : "Add New Assignment"}
            </h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && (
              <p className="success-message">{successMessage}</p>
            )}
            <form onSubmit={handleSubmitAssignment}>
              <div className="form-group">
                <label>Title:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Learning Outcomes:</label>
                <textarea
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Marking Criteria:</label>
                <textarea
                  value={markingCriteria}
                  onChange={(e) => setMarkingCriteria(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <SelectMenu onChange={handleSubjectChange} value={selectedSubject} />
              </div>
              <div className="form-group">
                <label>Additional Prompt:</label>
                {selectedSubject?.value === 'Custom' ? (
                  <MentionsInput
                    value={additionalPrompt}
                    onChange={(event, newValue) => setAdditionalPrompt(newValue)}
                    placeholder="Type '@' to select a prompt..."
                    className="mentions"
                    allowSuggestionsAboveCursor={true}
                    style={{ height: '200px' }}
                    singleLine={false}
                  >
                    <Mention
                      trigger="@"
                      data={mentionData}
                      markup="@[$__display__]($__id__)"
                      appendSpaceOnAdd={true}
                      renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                        <div className={`suggestion-item ${focused ? 'focused' : ''}`}>
                          {highlightedDisplay}
                        </div>
                      )}
                    />
                  </MentionsInput>
                ) : (
                  <div className="mentions read-only">
                    {renderMentions(additionalPrompt)}
                  </div>
                )}
              </div>
              <button type="submit">
                {editingAssignmentId ? "Save" : "Add Assignment"}
              </button>
              <button
                type="button"
                onClick={resetAssignmentForm}
                className="cancel-button"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* FORM FOR ADDING EXAM */}
        {showExamForm && !showForm && !showExamEditForm && (
          <div className="exam-form">
            <h3>Add New Exam</h3>
            {examErrorMessage && <p className="error-message">{examErrorMessage}</p>}
            {examSuccessMessage && <p className="success-message">{examSuccessMessage}</p>}
            <form onSubmit={handleExamSubmit}>
              <div className="form-group">
                <label>Exam Title:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date (YYYY-MM-DD):</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Questions (one per line, use " | " to separate questionText and markingCriteria):</label>
                <textarea
                  value={examQuestions}
                  onChange={(e) => setExamQuestions(e.target.value)}
                  rows={6}
                  placeholder="e.g.\nWhat is 2+2? | Must say 4\nDescribe photosynthesis | Mention chloroplasts"
                />
              </div>
              <button type="submit">Add Exam</button>
              <button
                type="button"
                onClick={() => {
                  setShowExamForm(false);
                  setExamErrorMessage(null);
                  setExamSuccessMessage(null);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* FORM FOR EDITING EXAM */}
        {showExamEditForm && !showForm && !showExamForm && (
          <div className="exam-form">
            <h3>Edit Exam</h3>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}
            <form onSubmit={handleUpdateExam}>
              <div className="form-group">
                <label>Exam Title:</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject:</label>
                <input
                  type="text"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date (YYYY-MM-DD):</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                />
              </div>
              <button type="submit">Save Changes</button>
              <button
                type="button"
                onClick={resetExamForm}
                className="cancel-button"
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
