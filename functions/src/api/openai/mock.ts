import { logger } from "firebase-functions/v2";
import { Requests } from "../../types";

export async function generateLyricsMock(data: Requests.GenerateSong): Promise<{ lyrics: string }> {
  logger.info(`🤖 OpenAI MOCK activ pentru stilul ${data.style}`);
  // Optional tiny delay to simulate minimal processing (configurable)
  const delayMs = parseInt(process.env.MOCK_OPENAI_MS || '0', 10);
  if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
  const mock = `<VERSURI>\nRefren:  \n${data.title} - refren mock  \n\nStrofa 1:  \nMock versuri pentru stilul ${data.style}  \n\nRefren:  \n${data.title} - refren mock`;
  return { lyrics: mock.replace('<VERSURI>', '').trim() };
}


