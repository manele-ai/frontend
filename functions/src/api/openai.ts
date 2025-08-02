import axios from "axios";
import { logger } from "firebase-functions/v2";
import { HttpsError } from "firebase-functions/v2/https";
import { openaiApiKey } from "../config";
import comercialePrompt from "../data/prompts/styles/comerciale.json";
import deOpulentaPrompt from "../data/prompts/styles/de-opulenta.json";
import jalePrompt from "../data/prompts/styles/jale.json";
import lautarestiPrompt from "../data/prompts/styles/lautaresti.json";
import maneleLivePrompt from "../data/prompts/styles/manele-live.json";
import muzicaPopularaPrompt from "../data/prompts/styles/muzica-populara.json";
import orientalePrompt from "../data/prompts/styles/orientale.json";
import petrecerePrompt from "../data/prompts/styles/petrecere.json";

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

const SYSTEM_PROMPT = `You are one of the best Romanian manelists. You will create lyrics for manele songs.`;

const BASE_PROMPT_TEMPLATE = `
MANEA_STYLE: [MANEA_STYLE]

LYRICS INSTRUCTION:
[LYRICS_INSTRUCTION]

STYLE_DESCRIPTION:
[STYLE_DESCRIPTION]

TASK: Create the lyrics for the manea song by taking into account the MANEA_STYLE, LYRICS_INSTRUCTION, and STYLE_DESCRIPTION. Return both in JSON format with the key "lyrics".

MUST:
- Lyrics must be in Romanian language.
- Lyrics  must be text only, no markdown, no emojis or other formatting.
- Respond only in JSON format with the key: "lyrics".
`;

function getPromptJsonTemplateFromStyle(style: string) {
  logger.log(`Getting prompt for style: "'${style}'"`);
  switch (style) {
    case "comerciale":
      return comercialePrompt;
    case "opulenta":
      return deOpulentaPrompt;
    case "jale":
      return jalePrompt;
    case "lautaresti":
      return lautarestiPrompt;
    case "live":
      return maneleLivePrompt;
    case "populare":
      return muzicaPopularaPrompt;
    case "orientale":
      return orientalePrompt;
    case "petrecere":
      return petrecerePrompt;
    default:
      throw new Error(`Invalid style: ${style}`);
  }
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

// Atm we only do lyrics generation and keep the style constant across manele types
export async function generateLyricsAndStyle(
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
): Promise<{ lyrics: string; styleDescription: string }> {
  try {
    // Load the appropriate prompt template based on style
    const promptTemplate: { lyrics: string; style: string } = getPromptJsonTemplateFromStyle(style)
    
    // Build the user message for lyrics
    let lyricsInstruction = promptTemplate.lyrics;
    if (title) {
      lyricsInstruction += `\nThe song title is: "${title}".`;
    }
    if (dedication) {
      lyricsInstruction += `\nThis song must include a dedication from ${dedication.from || 'someone'} to ${dedication.to || 'someone special'}`;
      if (dedication.message) {
        lyricsInstruction += ` with the message: "${dedication.message}"`;
      }
    }
    if (donation && donation.amount) {
      lyricsInstruction += `\nInclude references to throwing/donating money, specifically the amount of ${donation.amount} RON.`;
    }

    const userPrompt = BASE_PROMPT_TEMPLATE
      .replace("[MANEA_STYLE]", style)
      .replace("[LYRICS_INSTRUCTION]", lyricsInstruction)
      .replace("[STYLE_DESCRIPTION]", promptTemplate.style);

    const chatgptResponse = await apiClient.post<ChatCompletionResponse>("/chat/completions", {
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
    });

    logger.info("OpenAI response:", JSON.stringify(chatgptResponse.data, null, 2));

    // Extract the response text safely
    // TODO: should we store chatgpt responses in firestore?
    const responseText = findTextContentInResponse(chatgptResponse.data);
    
    // Parse the JSON response
    try {
      logger.info("Attempting to parse response", { responseText });
      // Parse the content which is a JSON string containing lyrics and style
      const result = JSON.parse(responseText);
      
      if (!result.lyrics) {
        throw new Error('Response missing required fields: lyrics');
      }
      return {
        lyrics: result.lyrics,
        styleDescription: promptTemplate.style,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse ChatGPT response as JSON: ${error.message}`);
      }
      throw new Error('Failed to parse ChatGPT response as JSON');
    }

  } catch (error) {
    logger.error("Error calling OpenAI API:", error);
    if (axios.isAxiosError(error)) {
      throw new HttpsError(
        "internal",
        `OpenAI API error: ${error.message}`,
        error.response?.data
      );
    }
    throw new HttpsError("internal", "Failed to generate lyrics and style with OpenAI API.");
  }
} 