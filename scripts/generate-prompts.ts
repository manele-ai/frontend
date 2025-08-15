import fs from 'fs';
import path from 'path';
import { buildLyricsPrompts } from '../functions/src/service/generation/lyrics';
import { Requests } from '../functions/src/types';

// Change working directory to functions/src to match runtime context
process.chdir(path.join(__dirname, '../functions/src'));

// Sample data to generate prompts
const sampleData: Requests.GenerateSong = {
  title: "Mihnea printul", //"[TITLE]",
  style: "", // will be filled in for each style
  from: "Radone", //"[FROM]",
  to: "Mihnea printul", //"[TO]",
  dedication: "Te pup sefule spor la bani!", //"[MESAJ_DEDICATIE]",
  wantsDedication: true,
  wantsDonation: true,
  donationAmount: 1000,
  lyricsDetails: "Mihnea printul este cel mai smeker Constantean si a mostenit un imperiu de doctori", //"[DETALII]"
};

// Get all style directories
const promptsDir = path.join(__dirname, '../functions/src/data/prompts');
const outputDir = path.join(__dirname, '../output');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Get all subdirectories in the prompts directory
const styles = fs.readdirSync(promptsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

// Generate prompts for each style
styles.forEach(style => {
  try {
    // Skip if not a style directory (e.g. node_modules)
    if (!fs.existsSync(path.join(promptsDir, style, 'LYRICS_PROMPT.md'))) {
      return;
    }

    console.log(`Generating prompts for style: ${style}`);
    
    // Create data for this style
    const styleData = { ...sampleData, style };
    
    // Generate the prompts using existing functions
    const { systemPrompt, userPrompt } = buildLyricsPrompts(styleData);
    
    // Create the full output
    const output = `# ${style.toUpperCase()} Style Prompts

## System Prompt
\`\`\`
${systemPrompt}
\`\`\`

## User Prompt
\`\`\`
${userPrompt}
\`\`\`
`;
    
    // Write to file
    const outputPath = path.join(outputDir, `${style}.md`);
    fs.writeFileSync(outputPath, output, 'utf8');
    
    console.log(`Generated prompt file for ${style} at ${outputPath}`);
  } catch (error) {
    console.error(`Error generating prompts for style ${style}:`, error);
  }
});

console.log('Prompt generation complete!'); 