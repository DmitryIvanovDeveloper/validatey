// Test markdown formatting function
function formatMarkdown(text) {
  if (!text || typeof text !== 'string') return text;

  let formatted = text;

  // Convert **bold** to <strong>bold</strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert *italic* to <em>italic</em>
  formatted = formatted.replace(/(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

  // Convert markdown lists to HTML lists
  if (formatted.includes('\n- ')) {
    const lines = formatted.split('\n');
    let inList = false;
    const result = [];

    for (const line of lines) {
      if (line.trim().startsWith('- ')) {
        if (!inList) {
          result.push('<ul>');
          inList = true;
        }
        result.push(`<li>${line.trim().substring(2)}</li>`);
      } else {
        if (inList) {
          result.push('</ul>');
          inList = false;
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push('</ul>');
    }

    formatted = result.join('\n');
  }

  // Convert line breaks to <br> tags
  formatted = formatted.replace(/\n/g, '<br>');

  return formatted;
}

// Test cases
const testCases = [
  "**Bold text** and *italic text*",
  "**Where to find them:**\n- Reddit\n- Indie Hackers\n- Twitter",
  "*Quoted text* with **bold words**",
  "Normal text without formatting"
];

console.log('🧪 Testing Markdown to HTML conversion:\n');

testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}:`);
  console.log('Input:', JSON.stringify(test));
  const result = formatMarkdown(test);
  console.log('Output:', result);
  console.log('---\n');
});

console.log('✅ Markdown conversion test completed!');