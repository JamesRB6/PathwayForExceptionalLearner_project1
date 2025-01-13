"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Papa, { ParseResult } from "papaparse";
import pLimit from "p-limit";

// Example interface for your single exam
interface Question {
  id: number;
  questionText: string;
  markingCriteria?: string | null;
}

interface Exam {
  id: number;
  title: string;
  subject: string;
  date: string; // or Date if you parse it
  questions: Question[];
}

// Student data from CSV parsing
interface Student {
  studentID: number;
  question: string;
  response: string;
  feedback?: string;
}

const UploadCSV: React.FC = () => {
  // Read examId from URL: e.g. /admin/UploadCSV?examId=123
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId");

  const [exam, setExam] = useState<Exam | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  // For multi-student navigation
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1) Fetch the specific exam given examId
  useEffect(() => {
    if (!examId) {
      console.log("No examId in query params, skipping fetchExam.");
      return;
    }

    const fetchExam = async (id: string) => {
      try {
        console.log(`Fetching exam with ID: ${id}`);
        const res = await fetch(`/api/exams/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch exam with ID ${id}`);
        }
        const data: Exam = await res.json();
        console.log("Fetched exam data:", data);
        setExam(data);
      } catch (error) {
        console.error("Error fetching exam:", error);
      }
    };

    fetchExam(examId);
  }, [examId]);

  // 2) Handle file selection
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    if (event.target.files && event.target.files.length > 0) {
      console.log("Selected file:", event.target.files[0].name);
      setFile(event.target.files[0]);
    }
  };

  // 3) Concurrency-limited batch processor
  const processBatchWithLimit = async (
    batch: string[][],
    limit: (fn: () => Promise<Student[]>) => Promise<Student[]>
  ): Promise<Student[]> => {
    console.log("Scheduling batch for processing:", batch);

    return limit(async () => {
      try {
        

        if (!exam) {
          console.error("Exam data is not available.");
          return [];
        }

        const combinedCriteria = exam.questions
          .map((q) => q.markingCriteria || "N/A")
          .join("\n---\n");
        console.log("Processing batch:", batch, "with criteria:", combinedCriteria);
        const apiResponse = await fetch("/api/CSV", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ batch, combinedCriteria }),
        });

        if (!apiResponse.ok) {
          console.error(
            "Error from /api/CSV. Response status:",
            apiResponse.status
          );
          return [];
        }

        const res = await apiResponse.json();
        console.log("API response received for this batch:", res);

        // Suppose res.message is a string with linebreaks
        return batch.map((row, index) => {
          const [studentID, question, response] = row;
          return {
            studentID: parseInt(studentID),
            question,
            response,
            feedback: res.message.split("\n\n")[index],
          };
        });
      } catch (error) {
        console.error("Error processing batch:", error);
        return [];
      }
    });
  };

  // 4) Handle CSV parse & process
  const handleProcessCSV = async (): Promise<void> => {
    if (!file) {
      console.log("No file selected, cannot process CSV.");
      return;
    }
    console.log("Starting CSV processing...");

    setLoading(true);
    const reader = new FileReader();

    reader.readAsText(file);
    reader.onload = (e) => {
      const text = e.target?.result as string;
      console.log("File read complete, parsing with Papa Parse...");

      Papa.parse<string[]>(text, {
        header: false,
        skipEmptyLines: true,
        complete: async (results: ParseResult<string[]>) => {
          console.log("Papa Parse complete. Raw results:", results.data);

          // Skip header row (assuming first row is header)
          const allRows = results.data.slice(1);
          console.log("Rows after skipping header:", allRows);

          const parsedData = allRows as string[][];

          // Batch & concurrency
          const batchSize = 10;
          const limit = pLimit(5);
          console.log(
            `Creating batches of size: ${batchSize}. Concurrency limit: 5`
          );

          const batches: string[][][] = [];
          for (let i = 0; i < parsedData.length; i += batchSize) {
            const chunk = parsedData.slice(i, i + batchSize);
            console.log(`Batch #${batches.length + 1} with rows:`, chunk);
            batches.push(chunk);
          }

          console.log(`Total batches created: ${batches.length}`);

          const allResults = (
            await Promise.all(
              batches.map((batch) => processBatchWithLimit(batch, limit))
            )
          ).flat();

          console.log(
            "All batch processing complete. Combined results:",
            allResults
          );

          setStudents(allResults);
          setCurrentIndex(0);
          setLoading(false);
        },
      });
    };
  };

  // 5) Group students by ID for navigation
  const groupedStudents = students.reduce<Record<number, Student[]>>(
    (acc, student) => {
      if (!acc[student.studentID]) {
        acc[student.studentID] = [];
      }
      acc[student.studentID].push(student);
      return acc;
    },
    {}
  );

  const studentIDs = Object.keys(groupedStudents).map(Number);

  // 6) Basic next/prev navigation
  const nextStudent = () => {
    setCurrentIndex((prev) => {
      if (studentIDs.length === 0) return 0;
      const nextIdx = (prev + 1) % studentIDs.length;
      console.log(`Navigating to student index: ${nextIdx}`);
      return nextIdx;
    });
  };

  const prevStudent = () => {
    setCurrentIndex((prev) => {
      if (studentIDs.length === 0) return 0;
      const nextIdx = prev - 1 < 0 ? studentIDs.length - 1 : prev - 1;
      console.log(`Navigating to student index: ${nextIdx}`);
      return nextIdx;
    });
  };

  const currentStudentID =
    studentIDs.length > 0 ? studentIDs[currentIndex] : undefined;
  const currentStudentData = currentStudentID
    ? groupedStudents[currentStudentID]
    : [];

  console.log("Currently showing studentID:", currentStudentID);

  return (
    <div className="mx-50 p-4 space-y-4">
      {/* Collapsible exam info */}
      <details open className="border border-gray-300 rounded w-100">
        <summary className="cursor-pointer bg-gray-100 p-2 font-semibold">
          {exam
            ? `Exam Information for "${exam.title}"`
            : "Exam Information (No exam data yet)"}
        </summary>

        {exam && (
          // Fixed height, scroll if content is too large
          <div className="p-4 bg-white flex flex-col gap-4 max-h-80 overflow-y-auto">
            <div className="text-gray-700">
              <strong>Subject:</strong> {exam.subject} <br />
              <strong>Date:</strong> {exam.date}
            </div>

            {exam.questions.map((q) => (
              <div
                key={q.id}
                className="flex flex-wrap border-b last:border-0 py-2"
              >
                <div className="w-full md:w-1/2 pr-4 mb-2 md:mb-0">
                  <strong>Question:</strong> {q.questionText}
                </div>
                <div className="w-full md:w-1/2">
                  <strong>Marking Criteria:</strong>{" "}
                  {q.markingCriteria || "N/A"}
                </div>
              </div>
            ))}
          </div>
        )}
      </details>

      {/* Buttons to load & process CSV */}
      <div className="space-x-2">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="inline-block"
        />
        <button
          type="button"
          onClick={handleProcessCSV}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? "Processing..." : "Process CSV"}
        </button>
      </div>

      {/* Nav for multiple students */}
      {studentIDs.length > 1 && (
        <div className="flex items-center gap-4">
          <button onClick={prevStudent} className="btn btn-sm">
            &larr; Prev
          </button>
          <span>
            Showing Student {currentIndex + 1} of {studentIDs.length}
          </span>
          <button onClick={nextStudent} className="btn btn-sm">
            Next &rarr;
          </button>
        </div>
      )}

      {/* Results table for the current student */}
      {currentStudentData.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border text-left">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Answer</th>
                <th className="border p-2">GPT Assessment</th>
              </tr>
            </thead>
            <tbody>
              {currentStudentData.map((entry, idx) => (
                <tr key={idx}>
                  <td className="border p-2">{entry.response}</td>
                  <td className="border p-2">{entry.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* If no students yet, we can show a placeholder */}
      {studentIDs.length === 0 && (
        <p className="text-gray-500">No students to display.</p>
      )}
    </div>
  );
};

export default UploadCSV;
