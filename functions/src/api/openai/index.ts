import axios from "axios";
import { logger } from "firebase-functions/v2";
import { buildLyricsPrompts } from "../../service/generation/lyrics/index";
import { Requests } from "../../types";
import { getOpenAIClient } from "./client";
import { generateLyricsMock } from "./mock";

const OPENAI_MODEL = "gpt-5";

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
    if (data.testMode && process.env.TEST_MODE === 'true') {
      return generateLyricsMock(data);
    }
    const { userPrompt, systemPrompt } = buildLyricsPrompts(data);
    logger.info("[OPENAI][generateLyrics] Built lyrics prompt for style " + data.style);

    const client = getOpenAIClient(); 

    const response = await client.responses.create({
      model: OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      reasoning: {
        "effort": "minimal",
      },
    })
    logger.info("[OPENAI][generateLyrics] Got response from OpenAI API");
    
    const textResponse = response.output_text?.trim();
    if (!textResponse) {
      console.error("[OPENAI][generateLyrics] No text content found in OpenAI response");
      throw new Error("No text content found in OpenAI response");
    }
    logger.info("[OPENAI][generateLyrics] Found response text from OpenAI API");
    logger.info("[OPENAI][generateLyrics] Response text: " + textResponse);
    
    // Parse and validate the response format
    const lyrics = parseResponseText(textResponse); 
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