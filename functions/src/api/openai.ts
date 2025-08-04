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

    const chatgptResponse = await apiClient.post<ChatCompletionResponse>("/chat/completions", {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 1.0, // >1 e mai creative, <1 e mai consistent
    });

    logger.info("[OPENAI][FULL RESPONSE] ", JSON.stringify(chatgptResponse.data, null, 2));

    // Extract the response text safely
    const responseText = findTextContentInResponse(chatgptResponse.data);
    logger.info("[OPENAI][LYRICS RESPONSE] ", responseText);
    
    // Parse and validate the response format
    const lyrics = parseResponseText(responseText);
    return {
      lyrics,
    };

  } catch (error) {
    logger.error("Error calling OpenAI API:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw new Error("Failed to generate lyrics with OpenAI API.");
  }
} 