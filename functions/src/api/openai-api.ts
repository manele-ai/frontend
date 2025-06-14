import axios from "axios";
import * as functions from "firebase-functions";
import { openaiApiKey } from "../config";

const apiClient = axios.create({
  baseURL: "https://api.openai.com/v1",
  headers: {
    "Authorization": `Bearer ${openaiApiKey.value()}`,
    "Content-Type": "application/json",
  },
});

interface ChatCompletionMessage {
  id: string;
  type: string;
  role: string;
  content: {
    type: string;
    text: string;
    annotations: any[];
  }[];
}

interface ChatCompletionResponse {
  choices: {
    message: ChatCompletionMessage;
  }[];
}

// TODO: need to separate display text from text value in UI and create a shared type for styles
// const STYLES = [
//     'Jale ( Guta/Salam Vechi)',
//     'De Petrecere ( Bem 7 zile )',
//     'Comerciale ( BDLP )',
//     'Lautaresti',
//     'Muzica Populara',
//     'Manele live',
//     'De Opulenta',
//     'Orientale'
//   ];

const SYSTEM_PROMPT = `You are the best Romanian manele music composer and lyricist. You will help create lyrics and music style descriptions for manele songs.`;

const BASE_PROMPT_TEMPLATE = `
You are the best Romanian manele music composer and lyricist. You will help create lyrics and music style descriptions for manele songs.

MANEA_STYLE: [MANEA_STYLE]

LYRICS INSTRUCTION:
[LYRICS_INSTRUCTION]

STYLE GUIDANCE:
[STYLE_INSTRUCTION]

TASK: Create the lyrics and the music style description for the manea song.

MUST:
- Lyrics must be in Romanian language.
- Lyrics and style description must be text only, no markdown, no emojis or other formatting.
- Respond only in JSON format with keys: "lyrics" and "style".
`;

function getPromptJsonTemplateFromStyle(style: string) {
  const path_prefix = '../data/prompts/styles/';
  switch (style) {
    case "Comerciale ( BDLP )":
      return require(`${path_prefix}/comerciale.json`);
    case "De Opulenta":
      return require(`${path_prefix}/de-opulenta.json`);
    case "'Jale ( Guta/Salam Vechi)'":
      return require(`${path_prefix}/jale.json`);
    case "Lautaresti":
      return require(`${path_prefix}/lautaresti.json`);
    case "Manele live":
      return require(`${path_prefix}/manele-live.json`);
    case "Muzica Populara":
      return require(`${path_prefix}/muzica-populara.json`);
    case "Orientale":
      return require(`${path_prefix}/orientale.json`);
    case "'De Petrecere ( Bem 7 zile )'":
      return require(`${path_prefix}/petrecere.json`);
    default:
      throw new Error(`Invalid style: ${style}`);
  }
}

function findTextContentInResponse(response: ChatCompletionResponse): string {
  // Safely traverse the response to find text content
  for (const choice of response.choices) {
    if (!choice.message?.content) continue;
    
    for (const content of choice.message.content) {
      if (content.type === 'output_text' && content.text) {
        return content.text;
      }
    }
  }
  throw new Error('No text content found in response');
}

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
      .replace("[STYLE_INSTRUCTION]", promptTemplate.style);

    const chatgptResponse = await apiClient.post<ChatCompletionResponse>("/chat/completions", {
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
    });

    // Extract the response text safely
    // TODO: should we store chatgpt responses in firestore?
    const responseText = findTextContentInResponse(chatgptResponse.data);
    
    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(responseText);
      if (!parsedResponse.lyrics || !parsedResponse.style) {
        throw new Error('Response missing required fields');
      }
      return {
        lyrics: parsedResponse.lyrics,
        styleDescription: parsedResponse.style
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to parse ChatGPT response as JSON: ${error.message}`);
      }
      throw new Error('Failed to parse ChatGPT response as JSON');
    }

  } catch (error) {
    functions.logger.error("Error calling OpenAI API:", error);
    if (axios.isAxiosError(error)) {
      throw new functions.https.HttpsError(
        "internal",
        `OpenAI API error: ${error.message}`,
        error.response?.data
      );
    }
    throw new functions.https.HttpsError("internal", "Failed to generate lyrics and style with OpenAI API.");
  }
} 