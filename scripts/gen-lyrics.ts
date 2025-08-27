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
  const { style } = options;
  
  try {
    console.log(`🎵 Generating lyrics for style: ${style}`);
    
    // Read the style prompt from file
    const prompts = readPrompts(style);
    
    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        { role: "system", content: prompts.systemPrompt },
        { role: "user", content: prompts.userPrompt }
      ],
      reasoning: {
          "effort": "minimal",
          "summary": "auto",
      },
    });
    const content = response.output_text;
    if (!content) {
      throw new Error('No content received from OpenAI API');
    }

    console.log('✅ Lyrics generated successfully!');
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
function parseCommandLineArgs(): { style: string; outputFile: string } {
  const args = process.argv.slice(2);
  let style = 'de-pahar';
  let outputFile = 'generated-lyrics.txt';
  
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
  
  return { style, outputFile };
}

function showHelp(): void {
  
  console.log(`
🎵 Lyrics Generation Script

Usage: npm run get-lyrics [options] [style]

Options:
  -s, --style <style>     Musical style (default: de-pahar)
  -o, --output <file>     Output file (default: generated-lyrics.txt)
  -h, --help             Show this help message

Examples:
  npm run get-lyrics
  npm run get-lyrics --style jale
  npm run get-lyrics jale
  npm run get-lyrics -s lautaresti -o lautaresti-lyrics.txt
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

