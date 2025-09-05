import * as dotenv from 'dotenv';
import * as fs from 'fs';
import OpenAI from 'openai';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface Prompts {
  systemPrompt: string;
  userPrompt: string;
}

interface GenerateLyricsOptions {
  style: string;
  outputFile?: string;
  refine?: boolean;
}

// Function to read style prompts from output/{style}.md files
function readPrompts(style: string): Prompts {
  try {
    const systemPromptPath = path.join(__dirname, '..', 'output', style, 'SYSTEM_PROMPT.md');
    const userPromptPath = path.join(__dirname, '..', 'output', style, 'USER_PROMPT.md');

    if (!fs.existsSync(systemPromptPath)) {
      throw new Error(`System prompt file not found: ${systemPromptPath}`);
    }
    if (!fs.existsSync(userPromptPath)) {
      throw new Error(`User prompt file not found: ${userPromptPath}`);
    }

    const systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    const userPrompt = fs.readFileSync(userPromptPath, 'utf8');

    return {
      systemPrompt,
      userPrompt,
    };
  } catch (error) {
    console.error(`Error reading style prompts for ${style}:`, error);
    throw error;
  }
}

async function generateLyrics(options: GenerateLyricsOptions): Promise<string> {
  const { style, refine = false } = options;

  try {
    console.log(`🎵 Generating lyrics for style: ${style}${refine ? ' (with refinement)' : ''}`);

    // Read the style prompt from file
    const prompts = readPrompts(style);

    // Generate initial lyrics
    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        { role: "system", content: prompts.systemPrompt },
        { role: "user", content: prompts.userPrompt }
      ],
      reasoning: {
        "effort": "minimal",
        "summary": null,
      },
    });

    let content = response.output_text;
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }
    console.log(`Initial lyrics generated successfully!\n ${content}`);

    // Write initial lyrics to file
    const initialOutputPath = path.join(__dirname, '..', 'output', 'generated-lyrics-initial.txt');
    fs.writeFileSync(initialOutputPath, content, 'utf8');
    console.log(`💾 Initial lyrics written to: ${initialOutputPath}`);

    // If refinement is requested, continue the conversation
    if (refine) {
      console.log('🔧 Refining lyrics...');

      // Add refinement prompt in Romanian
      const refinementPrompt = `Te rog să îmbunătățești versurile de mai sus urmând regulile, instrucțiunile și stilul specificat în prompt-ul inițial.
      Asigură-te că versurile sunt mai bune, mai coezive și respectă perfect instrucțiunile date.
      Nu vei adăuga nimic în plus față de versurile pe care le-ai îmbunătățit.`;

      // Get refined lyrics
      const refinedResponse = await openai.responses.create({
        model: "gpt-5",
        input: [
          { role: "system", content: prompts.systemPrompt },
          // {
          //   role: "user", content: prompts.userPrompt
          //     + `Îmbunătățește versurile de mai sus urmând regulile și stilul specificat în prompt`
          //     + `Asigură-te că versurile sunt mai bune, mai coezive și respectă perfect instrucțiunile date.`
          //     + `\n\nVersuri:\n${content}`
          // },
          { role: "user", content: prompts.userPrompt },
          { role: "assistant", content: content },
          { role: "user", content: refinementPrompt }
        ],
        reasoning: {
          "effort": "minimal",
          "summary": null,
        },
      });

      const refinedContent = refinedResponse.output_text;
      if (refinedContent) {
        content = refinedContent;
        console.log('✅ Lyrics refined successfully!');
      } else {
        console.log('⚠️ Refinement failed, using original lyrics');
      }
    } else {
      console.log('✅ Lyrics generated successfully!');
    }

    return content;
  } catch (error) {
    console.error('❌ Error generating lyrics:', error);
    throw error;
  }
}

function writeToFile(content: string, filename: string): void {
  try {
    const outputPath = path.join(__dirname, '..', 'output', 'generate-lyrics.txt');
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`💾 Lyrics written to: ${outputPath}`);
  } catch (error) {
    console.error('❌ Error writing to file:', error);
    throw error;
  }
}

// Function to parse command line arguments
function parseCommandLineArgs(): { style: string; outputFile: string; refine: boolean } {
  const args = process.argv.slice(2);
  let style = 'de-pahar';
  let outputFile = 'generated-lyrics.txt';
  let refine = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--style':
      case '-s':
        style = args[++i] || style;
        break;
      case '--output':
      case '-o':
        outputFile = args[++i] || outputFile;
        break;
      case '--refine':
      case '-r':
        refine = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
      default:
        if (!style || style === 'de-pahar') {
          style = args[i];
        }
        break;
    }
  }

  return { style, outputFile, refine };
}

function showHelp(): void {

  console.log(`
🎵 Lyrics Generation Script

Usage: npm run gen-lyrics [options] [style]

Options:
  -s, --style <style>     Musical style (default: de-pahar)
  -o, --output <file>     Output file (default: generated-lyrics.txt)
  -r, --refine            Refine the generated lyrics using ChatGPT
  -h, --help             Show this help message

Examples:
  npm run gen-lyrics
  npm run gen-lyrics --style jale
  npm run gen-lyrics jale
  npm run gen-lyrics -s lautaresti -o lautaresti-lyrics.txt
  npm run gen-lyrics --style jale --refine
  npm run gen-lyrics -s opulenta -r -o refined-opulenta.txt
`);
}

async function main() {
  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set');
    console.log('Please create a .env file with your OpenAI API key:');
    console.log('OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    // Parse command line arguments
    const options = parseCommandLineArgs();

    console.log('🚀 Starting lyrics generation...');
    console.log(`🎨 Style: ${options.style}`);
    console.log(`📁 Output file: ${options.outputFile}`);
    if (options.refine) {
      console.log(`🔧 Refinement: enabled`);
    }
    console.log('');

    const lyrics = await generateLyrics(options);

    console.log('');
    console.log('📄 Generated lyrics:');
    console.log('─'.repeat(50));
    console.log(lyrics);
    console.log('─'.repeat(50));

    // Write to file
    writeToFile(lyrics, options.outputFile);

    console.log('');
    console.log('🎉 Script completed successfully!');
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { generateLyrics, writeToFile };

