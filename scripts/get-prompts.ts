import fs from 'fs';
import path from 'path';
import { buildLyricsPrompts } from '../functions/src/service/generation/lyrics';
import { Requests } from '../functions/src/types';

// Change working directory to functions/src to match runtime context
process.chdir(path.join(__dirname, '../functions/src'));

// Sample data to generate prompts
const sampleData: Requests.GenerateSong = {
  title: "Ksamil venim", //"[TITLE]",
  style: "", // will be filled in for each style
  from: "", //"[FROM]",
  to: "", //"[TO]",
  dedication: "", //"[MESAJ_DEDICATIE]",
  wantsDedication: false,
  wantsDonation: false,
  donationAmount: 0,
  lyricsDetails: "Albania venim retarzii sunt pe drum, Răzvan, Robert și Andreea și nu ultimul dar cel din urmă grec, Alexandros. Ne am îmbătat, ne am distrat, a venit managerul să ne dea afară și Răzvan aka retard with document i a spus go to homeb", //"[DETALII]"
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
      
    // Write to file
    const outPathSystemPrompt = path.join(outputDir, style, 'SYSTEM_PROMPT.md');
    fs.mkdirSync(path.join(outputDir, style), { recursive: true });
    fs.writeFileSync(outPathSystemPrompt, systemPrompt, 'utf8');

    const outPathUserPrompt = path.join(outputDir, style, 'USER_PROMPT.md');
    fs.mkdirSync(path.join(outputDir, style), { recursive: true });
    fs.writeFileSync(outPathUserPrompt, userPrompt, 'utf8');

    console.log(`Generated prompt file for ${style} at ${outPathSystemPrompt} + ${outPathUserPrompt}`);
  } catch (error) {
    console.error(`Error generating prompts for style ${style}:`, error);
  }
});

console.log('Prompt generation complete!'); 