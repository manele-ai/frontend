import axios from "axios";
import { logger } from "firebase-functions/v2";
import { buildLyricsPrompts } from "../../service/generation/lyrics/index";
import { Requests } from "../../types";
import { getOpenAIClient } from "./client";
import { generateLyricsMock } from "./mock";

const OPENAI_MODEL = "gpt-5";

// Add refinement prompt in Romanian
const refinementPrompt = `Te rog să îmbunătățești versurile de mai sus urmând regulile, instrucțiunile și stilul specificat în prompt-ul inițial.
      Asigură-te că versurile sunt mai bune, mai coezive și respectă perfect instrucțiunile date.
      Nu vei adăuga nimic în plus față de versurile pe care le-ai îmbunătățit.`;

interface OpenAIResponse {
  output_text?: string;
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

function parseLyricsFromResponse(response: OpenAIResponse): string {
  const textResponse = response.output_text?.trim();
  if (!textResponse) {
    console.error("[OPENAI][generateLyrics] No text content found in OpenAI response");
    throw new Error("No text content found in OpenAI response");
  }
  logger.info("[OPENAI][generateLyrics] Found response text from OpenAI API: " + textResponse);
  // Parse and validate the response format
  const lyrics = parseResponseText(textResponse);
  logger.info("[OPENAI][generateLyrics] Parsed response text from OpenAI API");
  return lyrics;
}

// Atm we only do lyrics generation and keep the style constant across manele types
export async function generateLyrics(data: Requests.GenerateSong): Promise<{ lyrics: string }> {
  try {
    if (data.testMode && process.env.TEST_MODE === 'true') {
      return generateLyricsMock(data);
    }
    const { userPrompt, systemPrompt } = buildLyricsPrompts(data);
    logger.info("[OPENAI][generateLyrics] Built lyrics prompt for style " + data.style);

    const client = getOpenAIClient();

    // First lyrics iteration
    const response_1 = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      reasoning: {
        "effort": "minimal",
        "summary": null,
      },
    })
    logger.info("[OPENAI][generateLyrics] Got response #1 from OpenAI API: " + response_1.output_text);

    // Second lyrics iteration
    const response_2 = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
        { role: "assistant", content: response_1.output_text },
        { role: "user", content: refinementPrompt }
      ],
      reasoning: {
        "effort": "minimal",
        "summary": null,
      },
    });
    logger.info("[OPENAI][generateLyrics] Got response #2 from OpenAI API: " + response_2.output_text);
    const lyrics = parseLyricsFromResponse(response_2);

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