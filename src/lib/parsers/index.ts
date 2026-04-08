export { extractTextFromPdf } from './pdf';
export { extractTextFromDocx } from './docx';

export async function extractText(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (mimeType === 'application/pdf') {
    const { extractTextFromPdf } = await import('./pdf');
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const { extractTextFromDocx } = await import('./docx');
    return extractTextFromDocx(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}