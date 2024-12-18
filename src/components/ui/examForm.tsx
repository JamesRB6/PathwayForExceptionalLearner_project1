import React from 'react';

interface Question {
  id: number; 
  text: string;
  markingCriteria?: string;
}

interface ExamFormProps {
  titleHeading: string;
  errorMessage?: string | null;
  successMessage?: string | null;
  examTitle: string;
  examDate: string;
  examSubject: string;
  questions: Question[];
  newQuestionText: string;
  selectedQuestionId: number | null;
  markingCriteriaForSelected: string;
  onExamTitleChange: (value: string) => void;
  onExamDateChange: (value: string) => void;
  onExamSubjectChange: (value: string) => void;
  onAddQuestion: () => void;
  onNewQuestionTextChange: (value: string) => void;
  onSelectQuestion: (id: number) => void;
  onMarkingCriteriaChange: (value: string) => void;
  onDeleteQuestion: (id: number) => void; // Added prop for deleting a question
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitButtonText: string;
}

const ExamForm: React.FC<ExamFormProps> = ({
  titleHeading,
  errorMessage,
  successMessage,
  examTitle,
  examDate,
  examSubject,
  questions,
  newQuestionText,
  selectedQuestionId,
  markingCriteriaForSelected,
  onExamTitleChange,
  onExamDateChange,
  onExamSubjectChange,
  onAddQuestion,
  onNewQuestionTextChange,
  onSelectQuestion,
  onMarkingCriteriaChange,
  onDeleteQuestion,
  onSubmit,
  onCancel,
  submitButtonText
}) => {
  return (
    <div className="exam-form p-8 max-w-6xl mx-auto">
      <h3 className="text-3xl font-bold mb-4">{titleHeading}</h3>
      {errorMessage && <p className="error-message text-red-500 mb-2">{errorMessage}</p>}
      {successMessage && <p className="success-message text-green-500 mb-2">{successMessage}</p>}

      <form onSubmit={onSubmit}>
        {/* Exam Details Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
            <input 
              type="text" 
              value={examTitle} 
              onChange={(e) => onExamTitleChange(e.target.value)} 
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
              onChange={(e) => onExamDateChange(e.target.value)} 
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input 
              type="text" 
              value={examSubject} 
              onChange={(e) => onExamSubjectChange(e.target.value)} 
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
                onClick={onAddQuestion}
                className="mb-2 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 transition-colors"
              >
                Add Question
              </button>
              
              <textarea 
                value={newQuestionText}
                onChange={(e) => onNewQuestionTextChange(e.target.value)}
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
                    className={`p-2 mb-1 flex items-center justify-between cursor-pointer rounded hover:bg-gray-200 transition-colors ${q.id === selectedQuestionId ? 'bg-gray-200 font-semibold' : 'bg-white'}`}
                  >
                    <div onClick={() => onSelectQuestion(q.id)} className="flex-1 pr-2">
                      {q.text.length > 30 ? q.text.slice(0,30) + '...' : q.text}
                    </div>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); 
                        onDeleteQuestion(q.id);
                      }}
                      className="text-red-600 hover:text-red-800"
                      title="Delete this question"
                    >
                      X
                    </button>
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
                    onChange={(e) => onMarkingCriteriaChange(e.target.value)}
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
            {submitButtonText}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button ml-2 py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;
