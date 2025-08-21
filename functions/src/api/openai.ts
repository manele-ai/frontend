import axios from "axios";
import { logger } from "firebase-functions/v2";
import { openaiApiKey } from "../config";
import { buildLyricsPrompts } from "../service/generation/lyrics/index";
import { Requests } from "../types";

const OPENAI_MODEL = "gpt-4o";

const apiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Authorization": `Bearer ${openaiApiKey.value()}`,
    "Content-Type": "application/json",
  },
});

interface ChatCompletionMessage {
  role: string;
  content: string | null;
}

interface ChatCompletionResponse {
  choices: {
    message: ChatCompletionMessage;
  }[];
}

function findTextContentInResponse(response: ChatCompletionResponse): string {
  if (response.choices && response.choices.length > 0) {
    const message = response.choices[0].message;
    if (message && message.content) {
      return message.content;
    }
  }
  throw new Error("No text content found in OpenAI response");
}

function parseResponseText(responseText: string): string {
  const trimmedText = responseText.trim();
  if (!trimmedText.startsWith('<VERSURI>')) {
    throw new Error('Response text must start with <VERSURI> tag');
  }
  // Remove the <VERSURI> tag and trim any whitespace
  const lyrics = trimmedText.replace('<VERSURI>', '').trim();
  return lyrics;
}

// Atm we only do lyrics generation and keep the style constant across manele types
export async function generateLyrics(data : Requests.GenerateSong): Promise<{ lyrics: string }> {
  try {
    const { userPrompt, systemPrompt } = buildLyricsPrompts(data);
    logger.info("[OPENAI][generateLyrics] Built lyrics prompt for style " + data.style);

    const chatgptResponse = await apiClient.post<ChatCompletionResponse>("/chat/completions", {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 1.0, // >1 e mai creative, <1 e mai consistent
    });
    logger.info("[OPENAI][generateLyrics] Got response from OpenAI API");

    // Extract the response text safely
    const responseText = findTextContentInResponse(chatgptResponse.data);
    logger.info("[OPENAI][generateLyrics] Found response text from OpenAI API");
    logger.info("[OPENAI][generateLyrics] Response text: " + responseText);
    
    // Parse and validate the response format
    const lyrics = parseResponseText(responseText); 
    logger.info("[OPENAI][generateLyrics] Parsed response text from OpenAI API");
    
    return {
      lyrics,
    };

  } catch (error) {
    logger.error("[OPENAI][generateLyrics] Error generating lyrics:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(`Error generating lyrics: ${error.message}`);
    }
    throw new Error("Error generating lyrics");
  }
} 