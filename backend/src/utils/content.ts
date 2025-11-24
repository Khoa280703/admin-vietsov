// Helper to calculate word count, character count, and reading time from TipTap JSON
export function calculateStats(contentJson: string): {
  wordCount: number;
  characterCount: number;
  readingTime: number;
} {
  try {
    const content = typeof contentJson === "string" ? JSON.parse(contentJson) : contentJson;
    
    let text = "";
    
    function extractText(node: any): void {
      if (node.type === "text" && node.text) {
        text += node.text + " ";
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(extractText);
      }
    }
    
    if (content.content && Array.isArray(content.content)) {
      content.content.forEach(extractText);
    }
    
    const wordCount = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
    const characterCount = text.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed: 200 words/min
    
    return { wordCount, characterCount, readingTime };
  } catch (error) {
    return { wordCount: 0, characterCount: 0, readingTime: 0 };
  }
}

