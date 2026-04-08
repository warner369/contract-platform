export async function extractTextFromPdf(): Promise<string> {
  throw new Error(
    'PDF extraction is handled client-side. The server should not receive raw PDF files.',
  );
}