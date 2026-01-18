export interface QuizQuestion {
  id: string;
  timestamp: number; // Seconds into the video
  question: string;
  options: string[];
  correctAnswerIndex: number;
  feedback: string;
  verbFocus?: string; // The specific vocabulary/verb being tested
}

export interface QuizConfig {
  videoUrl: string;
  topic: string;
  transcript: string; // Optional context to help Gemini
}

export enum AppState {
  SETUP = 'SETUP',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface Score {
  correct: number;
  total: number;
}
