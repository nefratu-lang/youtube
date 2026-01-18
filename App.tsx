import React, { useState, useCallback, useMemo } from 'react';
import { generateQuestions } from './services/geminiService';
import { YouTubePlayer } from './components/YouTubePlayer';
import { QuizOverlay } from './components/QuizOverlay';
import { AppState, QuizQuestion, Score } from './types';
import { 
  Loader2, 
  Youtube, 
  Tent, 
  Map as MapIcon, 
  BookOpen, 
  Trophy,
  ArrowRight,
  Sparkles
} from 'lucide-react';

// Extract video ID from various YouTube URL formats
const getYouTubeId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function App() {
  const [state, setState] = useState<AppState>(AppState.SETUP);
  
  // Setup State
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=sSsTR8qqDl4');
  const [transcript, setTranscript] = useState('');
  const [topic, setTopic] = useState('Outdoor Boys Camping & Survival');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Playback State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const [activeQuestion, setActiveQuestion] = useState<QuizQuestion | null>(null);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [shouldPause, setShouldPause] = useState(false);
  const [score, setScore] = useState<Score>({ correct: 0, total: 0 });
  const [playbackTime, setPlaybackTime] = useState(0);

  const handleGenerate = async () => {
    const id = getYouTubeId(videoUrl);
    if (!id) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentVideoId(id);

    try {
      // Assuming a standard video length if unknown, or just default to 15 mins for generation spread
      const qs = await generateQuestions(topic, transcript, 15);
      
      // Sort questions by timestamp
      const sortedQs = qs.sort((a, b) => a.timestamp - b.timestamp);
      setQuestions(sortedQs);
      setState(AppState.PLAYING);
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTimeUpdate = useCallback((currentTime: number) => {
    setPlaybackTime(currentTime);

    // Find if there is a question at this time (within 1 second window) that hasn't been answered
    const pendingQuestion = questions.find(q => {
      const timeDiff = Math.abs(currentTime - q.timestamp);
      return timeDiff < 1.5 && !answeredQuestionIds.has(q.id);
    });

    if (pendingQuestion) {
      setShouldPause(true);
      setActiveQuestion(pendingQuestion);
    }
  }, [questions, answeredQuestionIds]);

  const handleQuestionComplete = (isCorrect: boolean) => {
    if (activeQuestion) {
      setScore(prev => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1
      }));
      setAnsweredQuestionIds(prev => new Set(prev).add(activeQuestion.id));
    }
    
    setActiveQuestion(null);
    setShouldPause(false);

    // Check if finished
    if (score.total + 1 >= questions.length && questions.length > 0) {
        // We don't end immediately, let the video finish or provide a "Finish" button
    }
  };

  const handleRestart = () => {
    setState(AppState.SETUP);
    setScore({ correct: 0, total: 0 });
    setAnsweredQuestionIds(new Set());
    setActiveQuestion(null);
    setShouldPause(false);
    setQuestions([]);
  };

  const progressPercentage = useMemo(() => {
    if (questions.length === 0) return 0;
    return (score.total / questions.length) * 100;
  }, [score, questions]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 text-emerald-700">
          <Tent className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight">Outdoor EduTube</h1>
        </div>
        {state === AppState.PLAYING && (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700">{score.total}/{questions.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-bold text-sm">
              <Trophy className="w-4 h-4" />
              <span>{score.correct} Correct</span>
            </div>
            <button 
              onClick={handleRestart}
              className="text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
            >
              Exit
            </button>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 lg:p-8">
        
        {state === AppState.SETUP && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">
                Turn any Adventure into a Lesson
              </h2>
              <p className="text-lg text-slate-600">
                Paste a YouTube link, add some context, and let AI generate an interactive vocabulary quiz.
              </p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-100 space-y-6">
              
              {/* YouTube Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">YouTube Video URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Tip: Outdoor Boys videos work great! Try: <code>https://www.youtube.com/watch?v=sSsTR8qqDl4</code>
                </p>
              </div>

              {/* Topic Input */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">Topic / Theme</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Transcript/Context Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-700">Transcript or Summary (Optional)</label>
                  <span className="text-xs text-emerald-600 font-medium">Improves accuracy</span>
                </div>
                <div className="relative">
                   <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste the video transcript here, or describe what happens in the video (e.g., 'Luke builds a snow cave and cooks steak'). If left empty, AI will guess based on the topic."
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none min-h-[120px] resize-none custom-scrollbar"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing Video...
                  </>
                ) : (
                  <>
                    Start Adventure
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </div>
          </div>
        )}

        {state === AppState.PLAYING && (
          <div className="flex flex-col lg:flex-row gap-6 h-full animate-in fade-in duration-500">
            
            {/* Video Area */}
            <div className="flex-1 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black ring-4 ring-white">
                <YouTubePlayer
                  videoId={currentVideoId}
                  onTimeUpdate={handleTimeUpdate}
                  shouldPause={shouldPause}
                  onPaused={() => {}} // Handled by effect
                />
                
                {/* The Question Overlay */}
                {shouldPause && activeQuestion && (
                  <QuizOverlay
                    question={activeQuestion}
                    onComplete={handleQuestionComplete}
                  />
                )}
              </div>

              {/* Timeline Visualization (Optional Enhancement) */}
              <div className="mt-4 px-2">
                 <div className="flex justify-between text-xs text-slate-400 font-medium mb-1">
                    <span>Start</span>
                    <span>End</span>
                 </div>
                 <div className="h-2 bg-slate-200 rounded-full relative">
                    <div 
                        className="absolute top-0 left-0 h-full bg-emerald-200 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((playbackTime / 900) * 100, 100)}%` }} // Assuming 15 mins max for visual bar
                    />
                    {questions.map((q) => {
                        const isAnswered = answeredQuestionIds.has(q.id);
                        return (
                            <div 
                                key={q.id}
                                className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm transform transition-all ${
                                    isAnswered ? 'bg-emerald-500 scale-110' : 'bg-amber-400'
                                }`}
                                style={{ left: `${Math.min((q.timestamp / 900) * 100, 100)}%` }} // Visual approx
                                title={`Question at ${q.timestamp}s`}
                            />
                        )
                    })}
                 </div>
              </div>
            </div>

            {/* Sidebar / Question List */}
            <div className="lg:w-80 shrink-0 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Lesson Plan
                </h3>
                <div className="space-y-3">
                  {questions.map((q, idx) => {
                     const isAnswered = answeredQuestionIds.has(q.id);
                     const isNext = !isAnswered && !answeredQuestionIds.has(questions[idx-1]?.id || 'start');
                     
                     return (
                        <div 
                          key={q.id} 
                          className={`p-3 rounded-lg border text-sm transition-all ${
                              isAnswered 
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 opacity-60' 
                                : isNext 
                                    ? 'bg-white border-emerald-500 shadow-md ring-1 ring-emerald-100' 
                                    : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-xs uppercase tracking-wider">
                                {isAnswered ? 'Completed' : `Question ${idx + 1}`}
                            </span>
                            <span className="text-xs font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                {Math.floor(q.timestamp / 60)}:{(q.timestamp % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <p className="line-clamp-2 font-medium">
                              {q.verbFocus ? `Focus: ${q.verbFocus}` : 'General Comprehension'}
                          </p>
                        </div>
                     )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
