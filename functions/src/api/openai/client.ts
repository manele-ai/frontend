import OpenAI from "openai";
import { openaiApiKey } from "../../config";

let _client: OpenAI | null = null;

export function getOpenAIClient() {
  if (_client) return _client;

  _client = new OpenAI({
    apiKey: openaiApiKey.value(),
  });

  return _client;
}