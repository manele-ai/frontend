import axios from "axios";
import { logger } from "firebase-functions/v2";
import { readFileSync } from 'fs';
import { openaiApiKey } from "../config";

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

const OUTPUT_FORMAT_PROMPT = `
# FORMATUL OUTPUT-ULUI
- Prima linie va fi <VERSURI> ca marcator pentru versurile care urmeaza.
- Dupa acceea vei scoate ca ouput doar versurile cu demarcatoarele ei de structura (e.g., Refren, Vers 1, etc.)
- Nu vei adauga nimic in plus.

Exemplu:
<VERSURI>
Vers 1:
...
Vers 2:
...
`;

// We add this at the end of user prompt and in the system prompt too
const USER_REQUESTS_PROMPT = `
# CERINTA UTILIZATORULUI
- Tema principala este: [TEMA_PRINCIPALA]

Vei indeplini cerinta utilizatorului.
`;

function fillInUserRequests({ title } : {title: string}) {
  return USER_REQUESTS_PROMPT.replace("[TEMA_PRINCIPALA]", title);
}

function buildUserPrompt(userRequests: string, { style } : {style: string}) {
  const filePath = `../data/prompts/${style}/LYRICS_PROMPT.md`;
  const lyricsPrompt = readFileSync(filePath, 'utf8');

  return [lyricsPrompt, OUTPUT_FORMAT_PROMPT, userRequests].join("\n\n");
}

function buildSystemPrompt(userRequests: string, { style } : {style: string}) {
  const filePath = `../data/prompts/${style}/SYSTEM_PROMPT.md`;
  const systemPromptStartSpecificToStyle = readFileSync(filePath, 'utf8');
  return [systemPromptStartSpecificToStyle, OUTPUT_FORMAT_PROMPT].join("\n\n");
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
export async function generateLyrics(
  style: string,
  title: string,
  lyricsDetails?: string,
  dedication?: {
    from?: string;
    to?: string;
    message?: string;
  },
  donation?: {
    amount: number;
  }
): Promise<{ lyrics: string }> {
  try {
    const userRequests = fillInUserRequests({ title });
    const userPrompt = buildUserPrompt(userRequests, { style });
    const systemPrompt = buildSystemPrompt(userRequests, { style });
    
    // let lyricsInstruction = lyricsPrompt;
    // if (dedication) {
    //   lyricsInstruction += `\nThis song must include a dedication from ${dedication.from || 'someone'} to ${dedication.to || 'someone special'}`;
    //   if (dedication.message) {
    //     lyricsInstruction += ` with the message: "${dedication.message}"`;
    //   }
    // }
    // if (donation && donation.amount) {
    //   lyricsInstruction += `\nInclude references to throwing/donating money, specifically the amount of ${donation.amount} RON.`;
    // }

    const chatgptResponse = await apiClient.post<ChatCompletionResponse>("/chat/completions", {
      model: "gpt-4o",
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