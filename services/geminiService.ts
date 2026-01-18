import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

export const generateQuestions = async (
  topic: string,
  transcript: string,
  durationMinutes: number = 10
): Promise<QuizQuestion[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Calculate reasonable timestamps based on duration
  const segments = [0.1, 0.3, 0.5, 0.7, 0.9].map(p => Math.floor(durationMinutes * 60 * p));

  const prompt = `
    You are an expert language teacher creating an interactive video quiz for a YouTube video.
    
    Video Context/Topic: ${topic}
    ${transcript ? `Transcript/Content Summary: ${transcript}` : 'Note: No transcript provided. Generate plausible questions based on the topic provided, assuming standard events for this type of video (e.g., setting up camp, cooking, traveling).'}

    Task: Create 5 multiple-choice questions that would likely appear at different points in the video to test vocabulary (specifically verbs) and comprehension.
    
    Target Audience: English Learners (A2/B1 level).
    
    Output Requirements:
    - Generate exactly 5 questions.
    - 'timestamp' should be an integer in seconds. I have estimated spread timestamps: ${segments.join(', ')}. Use these or slightly varied values close to them.
    - 'verbFocus' should be the key verb related to the question.
    - 'feedback' should explain why the answer is correct.

    Return the response as a JSON Array.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              timestamp: { type: Type.NUMBER, description: "Time in seconds when video pauses" },
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswerIndex: { type: Type.NUMBER },
              feedback: { type: Type.STRING },
              verbFocus: { type: Type.STRING }
            },
            required: ["timestamp", "question", "options", "correctAnswerIndex", "feedback", "verbFocus"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as QuizQuestion[];
    }
    throw new Error("No response from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
