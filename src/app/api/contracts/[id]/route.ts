import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/client';
import { getContractAccess } from '@/lib/db/authHelpers';
import { isFeedbackMode } from '@/lib/feedback-mode';

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const access = await getContractAccess(request, id);
  if (access instanceof NextResponse) return access;

  try {
    const db = getDb();

    const contract = await db
      .prepare('SELECT * FROM contracts WHERE id = ?')
      .bind(id)
      .first<{
        id: string;
        owner_id: string;
        title: string;
        summary: string;
        parties: string;
        lifecycle_state: string;
        feedback_mode: string;
        created_at: number;
        updated_at: number;
      }>();

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const clauses = await db
      .prepare('SELECT * FROM clauses WHERE contract_id = ? ORDER BY sort_order')
      .bind(id)
      .all<{
        id: string;
        number: string;
        title: string;
        text: string;
        category: string;
        risk_level: string;
        risk_notes: string;
        confidence: string;
        references_json: string;
      }>();

    const changes = await db
      .prepare('SELECT * FROM changes WHERE contract_id = ?')
      .bind(id)
      .all();


    const notes = await db
      .prepare('SELECT * FROM notes WHERE clause_id IN (SELECT id FROM clauses WHERE contract_id = ?)')
      .bind(id)
      .all();


    const threads = await db
      .prepare('SELECT * FROM threads WHERE clause_id IN (SELECT id FROM clauses WHERE contract_id = ?)')
      .bind(id)
      .all();


    const result = {
      id: contract.id,
      ownerId: contract.owner_id,
      title: contract.title,
      summary: contract.summary,
      parties: JSON.parse(contract.parties || '[]'),
      lifecycleState: contract.lifecycle_state,
      feedbackMode: contract.feedback_mode,
      createdAt: new Date(contract.created_at * 1000).toISOString(),
      updatedAt: new Date(contract.updated_at * 1000).toISOString(),
      role: access.role,
      permission: access.permission,
      clauses: (clauses.results || []).map((c) => ({
        id: c.id,
        number: c.number,
        title: c.title,
        text: c.text,
        category: c.category,
        riskLevel: c.risk_level,
        riskNotes: c.risk_notes,
        confidence: c.confidence,
        references: JSON.parse(c.references_json || '[]'),
      })),
      changes: (changes.results || []).map((ch: Record<string, unknown>) => ({
        id: ch.id,
        clauseId: ch.clause_id,
        type: ch.type,
        originalText: ch.original_text,
        suggestedText: ch.suggested_text,
        rationale: ch.rationale,
        status: ch.status,
        proposedBy: ch.proposed_by,
        createdAt: new Date((ch.created_at as number) * 1000).toISOString(),
      })),
      notes: (notes.results || []).map((n: Record<string, unknown>) => ({
        id: n.id,
        clauseId: n.clause_id,
        content: n.content,
        visibility: n.visibility,
        authorId: n.author_id,
        createdAt: new Date((n.created_at as number) * 1000).toISOString(),
      })),
      threads: (threads.results || []).map((t: Record<string, unknown>) => ({
        id: t.id,
        clauseId: t.clause_id,
        resolved: !!t.resolved,
        createdAt: new Date((t.created_at as number) * 1000).toISOString(),
      })),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get contract error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const access = await getContractAccess(request, id, 'edit');
  if (access instanceof NextResponse) return access;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const db = getDb();
    const now = Math.floor(Date.now() / 1000);

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.lifecycleState !== undefined) {
      updates.push('lifecycle_state = ?');
      values.push(body.lifecycleState);
    }
    if (body.summary !== undefined) {
      updates.push('summary = ?');
      values.push(body.summary);
    }
    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.parties !== undefined) {
      updates.push('parties = ?');
      values.push(JSON.stringify(body.parties));
    }
    if (body.feedbackMode !== undefined && isFeedbackMode(body.feedbackMode)) {
      updates.push('feedback_mode = ?');
      values.push(body.feedbackMode);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await db
      .prepare(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update contract error:', error);
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const access = await getContractAccess(request, id, 'edit');
  if (access instanceof NextResponse) return access;

  if (access.role !== 'owner') {
    return NextResponse.json(
      { error: 'Only the contract owner can delete it' },
      { status: 403 },
    );
  }

  try {
    const db = getDb();
    await db.prepare('DELETE FROM contracts WHERE id = ?').bind(id).run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete contract error:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 },
    );
  }
}