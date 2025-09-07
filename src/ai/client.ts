import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { SYSTEM_INSTRUCTION } from "./prompt";

export function getGenAI() {
  const genAI = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);
  
  console.log(`[AI] Usando modelo: ${env.AI_MODEL_NAME}`);
  
  return genAI.getGenerativeModel({
    model: env.AI_MODEL_NAME,
    systemInstruction: { 
      role: "system",
      parts: [{ text: SYSTEM_INSTRUCTION }] 
    },
    generationConfig: {
      maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
      temperature: 0.0,
      topP: 0.0,
      topK: 1,
    },
  });
}
