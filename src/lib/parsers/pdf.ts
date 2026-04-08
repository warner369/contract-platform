import pdf from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer, {
      // Disable image extraction for faster processing
      pagerender: function(pageData: { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }) {
        return pageData.getTextContent().then(function(content) {
          return content.items.map((item) => item.str).join(' ');
        });
      },
    });

    // Clean up the extracted text
    const text = data.text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error('Failed to extract text from PDF. Please ensure it contains selectable text.');
  }
}