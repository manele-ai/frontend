# Lyrics Generation Script

This script uses the OpenAI API to generate Romanian lyrics in various musical styles by reading style prompts from `output/{style}/SYSTEM_PROMPT.md` and `output/{style}/USER_PROMPT.md` files.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the scripts directory with your OpenAI API key:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. Get your OpenAI API key from: https://platform.openai.com/api-keys

## Usage

### Basic Usage
```bash
npm run gen-lyrics
```

### With Command Line Arguments
```bash
# Specify style
npm run gen-lyrics jale

# Use long options
npm run gen-lyrics --style lautaresti

# Specify output file
npm run gen-lyrics -s opulenta -o opulenta-lyrics.txt

# Show help
npm run gen-lyrics --help
```

## Command Line Options

- `-s, --style <style>` - Musical style (default: de-pahar)
- `-o, --output <file>` - Output file (default: generated-lyrics.txt)
- `-h, --help` - Show help message

## Available Styles

The script expects style prompt files in the `output/{style}/` directory structure:

- `de-pahar/` - Traditional Romanian drinking songs
- `jale/` - Sad, melancholic love songs
- `lautaresti/` - Traditional Romanian folk music
- `manele-live/` - Live manele style
- `opulenta/` - Opulent/luxury style
- `orientale/` - Oriental style
- `populara/` - Popular Romanian music
- `trapanele/` - Trapanele style

## How It Works

1. **Dynamic Style Loading**: The script reads style prompts from `output/{style}/SYSTEM_PROMPT.md` and `output/{style}/USER_PROMPT.md` files
2. **Prompt Reading**: Reads system and user prompts directly from separate files
3. **OpenAI API**: Sends the prompts to OpenAI's GPT-5 model using the responses API
4. **File Output**: Saves the generated lyrics to a file

## Style Prompt Files

The script expects style prompt files in this directory structure:
```
output/
├── de-pahar/
│   ├── SYSTEM_PROMPT.md
│   └── USER_PROMPT.md
├── jale/
│   ├── SYSTEM_PROMPT.md
│   └── USER_PROMPT.md
└── ...
```

## Customization

You can modify the script to:
- Add new musical styles by creating new style directories with SYSTEM_PROMPT.md and USER_PROMPT.md files
- Change the default style
- Modify the output file naming convention
- Add more command line options

## Output

The generated lyrics will be:
1. Displayed in the console with nice formatting
2. Written to the specified output file (default: `output/generate-lyrics.txt`)

## Example Output

```
🚀 Starting lyrics generation...
🎨 Style: jale
📁 Output file: generated-lyrics.txt

🎵 Generating lyrics for style: jale
✅ Lyrics generated successfully!

📄 Generated lyrics:
──────────────────────────────────────────────────
[Generated lyrics content here]
──────────────────────────────────────────────────
💾 Lyrics written to: /path/to/output/generate-lyrics.txt

🎉 Script completed successfully!
```

## Error Handling

The script includes comprehensive error handling for:
- Missing OpenAI API key
- Missing style prompt files
- File read/write errors
- OpenAI API errors
- Invalid command line arguments

## Available Scripts

- `npm run gen-lyrics` - Generate lyrics using OpenAI API
- `npm run generate-prompts` - Generate prompt files from the functions source
