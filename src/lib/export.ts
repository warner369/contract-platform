import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  InsertedTextRun,
  DeletedTextRun,
} from 'docx';
import type { ContractState } from '@/types/contract';

let revisionIdCounter = 0;
function nextRevisionId(): number {
  revisionIdCounter += 1;
  return revisionIdCounter;
}

const AUTHOR = 'Clause AI';

export async function exportContractToDocx(state: ContractState): Promise<Blob> {
  const { original, current, changes } = state;
  if (!original || !current) {
    throw new Error('No contract data available to export');
  }

  revisionIdCounter = 0;
  const isoNow = new Date().toISOString();

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: original.title, bold: true, size: 32 })],
      spacing: { after: 120 },
    }),
  );

  if (original.parties.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Parties: ', bold: true, size: 22 }),
          new TextRun({ text: original.parties.join(', '), size: 22 }),
        ],
        spacing: { after: 80 },
      }),
    );
  }

  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  for (const clause of original.clauses) {
    const clauseChanges = changes.filter((c) => c.clauseId === clause.id);
    const tracked = clauseChanges.filter(
      (c) => c.status === 'accepted' || c.status === 'pending',
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${clause.number}  ${clause.title}`,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 360, after: 80 },
      }),
    );

    if (tracked.length > 0) {
      const runs: (TextRun | InsertedTextRun | DeletedTextRun)[] = [];

      for (const change of tracked) {
        if (change.type === 'modify') {
          runs.push(
            new DeletedTextRun({
              text: change.originalText,
              id: nextRevisionId(),
              author: AUTHOR,
              date: isoNow,
            }),
          );
          runs.push(
            new InsertedTextRun({
              text: change.suggestedText,
              id: nextRevisionId(),
              author: AUTHOR,
              date: isoNow,
            }),
          );
        } else if (change.type === 'add') {
          runs.push(
            new InsertedTextRun({
              text: change.suggestedText,
              id: nextRevisionId(),
              author: AUTHOR,
              date: isoNow,
            }),
          );
        } else if (change.type === 'remove') {
          runs.push(
            new DeletedTextRun({
              text: change.originalText,
              id: nextRevisionId(),
              author: AUTHOR,
              date: isoNow,
            }),
          );
        }
      }

      children.push(new Paragraph({ children: runs, spacing: { after: 120 } }));
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: clause.text, size: 22 })],
          spacing: { after: 120 },
        }),
      );
    }
  }

  const addedClauseIds = new Set(original.clauses.map((c) => c.id));
  const addedClauses = changes.filter(
    (c) => c.type === 'add' && !addedClauseIds.has(c.clauseId) && (c.status === 'accepted' || c.status === 'pending'),
  );

  for (const change of addedClauses) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `New Clause`,
            bold: true,
            size: 24,
          }),
        ],
        spacing: { before: 360, after: 80 },
      }),
    );
    children.push(
      new Paragraph({
        children: [
          new InsertedTextRun({
            text: change.suggestedText,
            id: nextRevisionId(),
            author: AUTHOR,
            date: isoNow,
          }),
        ],
        spacing: { after: 120 },
      }),
    );
  }

  const doc = new Document({
    features: {
      trackRevisions: true,
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}