"use client";
import styles from "./page.module.css";
import { useState, useEffect, useMemo } from "react";
import SelectMenu from '@/components/select-menu/selectmenu';
import { SubjectOptions, Biology, History, SubjectOption } from '@/components/select-menu/data';
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions';
import { Container, Flex, Heading } from "@radix-ui/themes";
import { CaretRightIcon, CaretLeftIcon } from "@radix-ui/react-icons";
import React from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Question {
  id: number;
  text: string;
  markingCriteria?: string;
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  date: string;
  updatedAt: string;
  questions: {id: number; questionText: string; markingCriteria?: string;}[];
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
  const [examErrorMessage, setExamErrorMessage] = useState<string | null>(null);
  const [examSuccessMessage, setExamSuccessMessage] = useState<string | null>(null);
  const [showExamEditForm, setShowExamEditForm] = useState(false);

  // New states for questions UI
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [markingCriteriaForSelected, setMarkingCriteriaForSelected] = useState("");

  const [scrollStates, setScrollStates] = useState<{ [subject: string]: { showScrollButtons: boolean } }>({});

  useEffect(() => {
    fetch("/api/assignment")
      .then((res) => res.json())
      .then((data) => setAssignments(data))
      .catch((err) => console.error("Error fetching assignments", err));
  }, []);

  // When viewing exams, fetch them
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
  const processTemplateText = (text: string) => {
    const templateMap: { [key: string]: string } = {
      'biology-prompt': Biology,
      'history-prompt': History,
    };
    return text.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, (match, display, id) => {
      return templateMap[id] || match;
    });
  };

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
      
      // Convert exam.questions to local questions state
      const convertedQuestions = exam.questions.map((q) => ({
        id: q.id,
        text: q.questionText,
        markingCriteria: q.markingCriteria || ""
      }));
      setQuestions(convertedQuestions);
      setSelectedQuestionId(null);
      setNewQuestionText("");
      setMarkingCriteriaForSelected("");

      setShowExamEditForm(true);
    }
  }

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

  // NEW HANDLER FUNCTIONS AND STATES FOR QUESTIONS
  function handleAddQuestion() {
    if (newQuestionText.trim()) {
      const newQuestion = {
        id: Date.now(),
        text: newQuestionText.trim(),
        markingCriteria: ""
      };
      setQuestions([...questions, newQuestion]);
      setNewQuestionText("");

      if (selectedQuestionId === null) {
        setSelectedQuestionId(newQuestion.id);
        setMarkingCriteriaForSelected("");
      }
    }
  }

  function handleSelectQuestion(id: number) {
    setSelectedQuestionId(id);
    const q = questions.find(q => q.id === id);
    if (q) {
      setMarkingCriteriaForSelected(q.markingCriteria || "");
    }
  }

  function handleMarkingCriteriaChange(val: string) {
    setMarkingCriteriaForSelected(val);
    setQuestions(questions.map(q => q.id === selectedQuestionId ? { ...q, markingCriteria: val } : q));
  }

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle || !examSubject || !examDate) {
      setExamErrorMessage("Please fill in all fields for the exam");
      return;
    }

    const questionsArray = questions.map(q => ({
      questionText: q.text,
      markingCriteria: q.markingCriteria || ""
    }));

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
        setExamErrorMessage(null);
        setExamSuccessMessage(null);
        setShowExamForm(false);
        // Reset question states
        setQuestions([]);
        setNewQuestionText("");
        setSelectedQuestionId(null);
        setMarkingCriteriaForSelected("");
      } else {
        setExamErrorMessage("Failed to add exam");
      }
    } catch (error) {
      console.error(error);
      setExamErrorMessage("An error occurred while adding the exam");
    }
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExamId) return;

    const questionsArray = questions.map(q => ({
      questionText: q.text,
      markingCriteria: q.markingCriteria || ""
    }));

    try {
      const response = await fetch(`/api/exams/${editingExamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: examTitle,
          subject: examSubject,
          date: examDate,
          questions: questionsArray,
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
    // Reset question states
    setQuestions([]);
    setNewQuestionText("");
    setSelectedQuestionId(null);
    setMarkingCriteriaForSelected("");
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
    <div className={styles.assignmentPage}>
      <div className={styles.assignmentContainer}>
        {!showForm && !showExamForm && !showExamEditForm ? (
          <div className={styles.assignmentList}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* <Link href="/">
                <h1 style={{ cursor: "pointer", fontSize: "1.5rem", marginBottom: "1rem" }}>Home</h1>
              </Link> */}
              {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Teachers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            </div>
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
                        <Heading as="h2" size="5" className="subjectHeading">{subj}</Heading>
                        <div className={styles.cardRowContainer}>
                          {showScrollButtons && (
                            <button 
                              className={styles.scrollButtonLeft} 
                              onClick={() => scrollLeft(subj)}
                              aria-label="Scroll left"
                            >
                          <CaretLeftIcon style={{ color: '#000', width: '24px', height: '24px', stroke: 'currentColor', strokeWidth: 1 }} />
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
                          <CaretRightIcon style={{ color: '#000', width: '24px', height: '24px', stroke: 'currentColor', strokeWidth: 1 }} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={handleAddAssignment} className={styles.addButton}>
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
                        <Heading as="h2" size="5" className="subjectHeading">{subj}</Heading>
                        <div className={styles.cardRowContainer}>
                          {showScrollButtons && (
                            <button 
                              className={styles.scrollButtonLeft} 
                              onClick={() => scrollLeft(subj)}
                              aria-label="Scroll left"
                            >
                              <CaretLeftIcon  style={{ color: '#000', width: '24px', height: '24px', stroke: 'currentColor', strokeWidth: 1 }}/>
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
                          <CaretRightIcon style={{ color: '#000', width: '24px', height: '24px', stroke: 'currentColor', strokeWidth: 1 }} />
                          </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {/* BUTTON TO ADD NEW EXAM */}
                  <button onClick={() => {
                    setShowExamForm(true);
                    // Reset exam states for adding a new one
                    setExamTitle("");
                    setExamSubject("");
                    setExamDate("");
                    setQuestions([]);
                    setNewQuestionText("");
                    setSelectedQuestionId(null);
                    setMarkingCriteriaForSelected("");
                    setExamErrorMessage(null);
                    setExamSuccessMessage(null);
                  }} className={styles.addButton}>
                    Add New Exam
                  </button>
                </>
              )}
            </Container>
          </div>
        ) : null}

        {/* FORM FOR ADDING/EDITING ASSIGNMENT */}
        {showForm && !showExamForm && !showExamEditForm && (
          <div className={styles.assignmentForm}>
            <h3>
              {editingAssignmentId ? "Edit Assignment" : "Add New Assignment"}
            </h3>
            {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
            {successMessage && (
              <p className={styles.successMessage}>{successMessage}</p>
            )}
            <form onSubmit={handleSubmitAssignment}>
            <div className={styles.formGroup}>
            <label className={styles.labels}>Title:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labels}>Learning Outcomes:</label>
                <textarea
                  className={styles.textarea}
                  value={learningOutcomes}
                  onChange={(e) => setLearningOutcomes(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labels}>Marking Criteria:</label>
                <textarea
                  className={styles.textarea}
                  value={markingCriteria}
                  onChange={(e) => setMarkingCriteria(e.target.value)}
                  required
                  rows={4}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labels}>Subject:</label>
                <div className={styles.selectMenuContainer}>
                <SelectMenu onChange={handleSubjectChange} value={selectedSubject} />
              </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.labels}>Additional Prompt:</label>
                {selectedSubject?.value === 'Custom' ? (
                  <MentionsInput
                    value={additionalPrompt}
                    onChange={(event, newValue) => setAdditionalPrompt(newValue)}
                    placeholder="Type '@' to select a prompt..."
                    className={styles.mentions}
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
                        <div className={`${styles.suggestionItem} ${focused ? styles.focused : ''}`}>
                          {highlightedDisplay}
                        </div>
                      )}
                    />
                  </MentionsInput>
                ) : (
                  <div className={`${styles.mentions} ${styles.readOnly}`}>
                    {renderMentions(additionalPrompt)}
                  </div>
                )}
              </div>
              <button type="submit" className={styles.submitButton}>
                {editingAssignmentId ? "Save" : "Add Assignment"}
              </button>
              <button
                type="button"
                onClick={resetAssignmentForm}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* FORM FOR ADDING EXAM */}
        {showExamForm && !showForm && !showExamEditForm && (
          // Add Exam form with questions UI
          // Handlers and states defined above are now used here
          <div className="exam-form p-8 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Add New Exam</h3>
            {examErrorMessage && <p className="error-message text-red-500 mb-2">{examErrorMessage}</p>}
            {examSuccessMessage && <p className="success-message text-green-500 mb-2">{examSuccessMessage}</p>}

            <form onSubmit={handleExamSubmit}>
              {/* Exam Details Row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                  <input 
                    type="text" 
                    value={examTitle} 
                    onChange={(e) => setExamTitle(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter exam title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={examSubject} 
                    onChange={(e) => setExamSubject(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="e.g. Biology"
                    required
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Questions</h2>
                <div className="flex space-x-4" style={{height: '400px'}}>
                  {/* Left Column: Add question and list */}
                  <div className="w-1/3 flex flex-col">
                    <button 
                      type="button"
                      onClick={handleAddQuestion}
                      className="mb-2 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                    >
                      Add Question
                    </button>
                    <textarea 
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Type a question here..."
                      className="block w-full mb-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      style={{height: '100px'}}
                    />
                    <div className="flex-1 overflow-auto border rounded-md p-2 bg-gray-50">
                      {questions.length === 0 && (
                        <p className="text-gray-500">No questions added yet</p>
                      )}
                      {questions.map(q => (
                        <div 
                          key={q.id} 
                          onClick={() => handleSelectQuestion(q.id)}
                          className={`p-2 mb-1 cursor-pointer rounded hover:bg-gray-200 transition-colors ${q.id === selectedQuestionId ? 'bg-gray-200 font-semibold' : 'bg-white'}`}
                        >
                          {q.text.length > 30 ? q.text.slice(0,30) + '...' : q.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Marking Criteria */}
                  <div className="w-2/3 flex flex-col">
                    {selectedQuestionId ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marking Criteria</label>
                        <textarea 
                          value={markingCriteriaForSelected}
                          onChange={(e) => handleMarkingCriteriaChange(e.target.value)}
                          placeholder="Define how this question should be graded..."
                          className="block w-full flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Select a question from the left to add marking criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Exam
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExamForm(false);
                    setExamErrorMessage(null);
                    setExamSuccessMessage(null);
                    setExamTitle("");
                    setExamSubject("");
                    setExamDate("");
                    setQuestions([]);
                    setNewQuestionText("");
                    setSelectedQuestionId(null);
                    setMarkingCriteriaForSelected("");
                  }}
                  className="cancel-button ml-2 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* FORM FOR EDITING EXAM */}
        {showExamEditForm && !showForm && !showExamForm && (
          <div className="exam-form p-8 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold mb-4">Edit Exam</h3>
            {errorMessage && <p className="error-message text-red-500 mb-2">{errorMessage}</p>}
            {successMessage && <p className="success-message text-green-500 mb-2">{successMessage}</p>}

            <form onSubmit={handleUpdateExam}>
              {/* Exam Details Row */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                  <input 
                    type="text" 
                    value={examTitle} 
                    onChange={(e) => setExamTitle(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={examDate} 
                    onChange={(e) => setExamDate(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    value={examSubject} 
                    onChange={(e) => setExamSubject(e.target.value)} 
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Questions Section for editing */}
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Questions</h2>
                <div className="flex space-x-4" style={{height: '400px'}}>
                  {/* Left Column - Add question and list */}
                  <div className="w-1/3 flex flex-col">
                    <button 
                      type="button"
                      onClick={handleAddQuestion}
                      className="mb-2 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
                    >
                      Add Question
                    </button>
                    <textarea 
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="Type a question here..."
                      className="block w-full mb-2 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                      style={{height: '100px'}}
                    />
                    <div className="flex-1 overflow-auto border rounded-md p-2 bg-gray-50">
                      {questions.length === 0 && (
                        <p className="text-gray-500">No questions added yet</p>
                      )}
                      {questions.map(q => (
                        <div 
                          key={q.id} 
                          onClick={() => handleSelectQuestion(q.id)}
                          className={`p-2 mb-1 cursor-pointer rounded hover:bg-gray-200 transition-colors ${q.id === selectedQuestionId ? 'bg-gray-200 font-semibold' : 'bg-white'}`}
                        >
                          {q.text.length > 30 ? q.text.slice(0,30) + '...' : q.text}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Marking Criteria */}
                  <div className="w-2/3 flex flex-col">
                    {selectedQuestionId ? (
                      <>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Marking Criteria</label>
                        <textarea 
                          value={markingCriteriaForSelected}
                          onChange={(e) => handleMarkingCriteriaChange(e.target.value)}
                          placeholder="Define how this question should be graded..."
                          className="block w-full flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                        />
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-gray-500">Select a question from the left to add marking criteria</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Changes Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={resetExamForm}
                  className="cancel-button ml-2 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
