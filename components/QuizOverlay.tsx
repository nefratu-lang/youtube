import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import { CheckCircle, XCircle, Play, BrainCircuit } from 'lucide-react';

interface QuizOverlayProps {
  question: QuizQuestion;
  onComplete: (isCorrect: boolean) => void;
}

export const QuizOverlay: React.FC<QuizOverlayProps> = ({ question, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (index: number) => {
    if (isSubmitted) return;
    setSelectedOption(index);
    setIsSubmitted(true);
  };

  const handleContinue = () => {
    if (selectedOption !== null) {
      onComplete(selectedOption === question.correctAnswerIndex);
    }
  };

  const isCorrect = selectedOption === question.correctAnswerIndex;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <BrainCircuit className="w-6 h-6" />
            <h2 className="font-bold text-lg">Quick Quiz!</h2>
          </div>
          {question.verbFocus && (
            <span className="bg-emerald-800 text-emerald-100 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-semibold">
              Focus: {question.verbFocus}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 leading-tight">
            {question.question}
          </h3>

          <div className="grid gap-3">
            {question.options.map((option, idx) => {
              let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ";
              
              if (!isSubmitted) {
                btnClass += "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50";
              } else {
                if (idx === question.correctAnswerIndex) {
                  btnClass += "border-green-500 bg-green-50 text-green-800";
                } else if (idx === selectedOption) {
                  btnClass += "border-red-500 bg-red-50 text-red-800";
                } else {
                  btnClass += "border-gray-100 text-gray-400 opacity-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSubmit(idx)}
                  disabled={isSubmitted}
                  className={btnClass}
                >
                  <span className="font-medium text-lg">{option}</span>
                  {isSubmitted && idx === question.correctAnswerIndex && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                  {isSubmitted && idx === selectedOption && idx !== question.correctAnswerIndex && (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback Section */}
          {isSubmitted && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom-2">
              <div className={`p-4 rounded-lg mb-4 flex gap-3 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                 <div className="shrink-0 mt-1">
                    {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                 </div>
                 <div>
                    <p className="font-bold">{isCorrect ? 'Correct!' : 'Not quite right.'}</p>
                    <p className="text-sm mt-1 opacity-90">{question.feedback}</p>
                 </div>
              </div>
              
              <button
                onClick={handleContinue}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg"
              >
                <Play className="w-5 h-5 fill-current" />
                Continue Video
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
