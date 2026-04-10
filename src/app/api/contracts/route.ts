import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { getDb } from '@/lib/db/client';
import { requireAuth } from '@/lib/db/authHelpers';
import type { ParsedContract } from '@/types/contract';

export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const body = (await request.json()) as { contract: ParsedContract };
    const contract = body.contract;

    if (!contract || !contract.title || !contract.clauses) {
      return NextResponse.json(
        { error: 'Invalid contract data' },
        { status: 400 },
      );
    }

    const db = getDb();
    const contractId = nanoid();
    const now = Math.floor(Date.now() / 1000);

    await db
      .prepare(
        'INSERT INTO contracts (id, owner_id, title, summary, parties, lifecycle_state, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .bind(
        contractId,
        user.id,
        contract.title,
        contract.summary || '',
        JSON.stringify(contract.parties || []),
        'structured',
        now,
        now,
      )
      .run();

    for (let i = 0; i < contract.clauses.length; i++) {
      const clause = contract.clauses[i];
      const clauseId = clause.id || nanoid();

      await db
        .prepare(
          'INSERT INTO clauses (id, contract_id, number, title, text, category, risk_level, risk_notes, confidence, references_json, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          clauseId,
          contractId,
          clause.number,
          clause.title,
          clause.text,
          clause.category,
          clause.riskLevel,
          clause.riskNotes || '',
          clause.confidence || 'medium',
          JSON.stringify(clause.references || []),
          i,
        )
        .run();
    }

    return NextResponse.json({
      id: contractId,
      title: contract.title,
      lifecycleState: 'structured',
      createdAt: new Date(now * 1000).toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Create contract error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create contract';
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult;

  try {
    const db = getDb();

    const owned = await db
      .prepare('SELECT id, title, lifecycle_state, created_at FROM contracts WHERE owner_id = ? ORDER BY created_at DESC')
      .bind(user.id)
      .all<{ id: string; title: string; lifecycle_state: string; created_at: number }>();

    const collaborated = await db
      .prepare(
        `SELECT c.id, c.title, c.lifecycle_state, c.created_at, cc.permission
         FROM contracts c
         JOIN contract_collaborators cc ON c.id = cc.contract_id
         WHERE cc.user_id = ? AND cc.accepted_at IS NOT NULL
         ORDER BY c.created_at DESC`,
      )
      .bind(user.id)
      .all<{ id: string; title: string; lifecycle_state: string; created_at: number; permission: string }>();

    const contracts = [
      ...((owned.results || []).map((c) => ({
        id: c.id,
        title: c.title,
        lifecycleState: c.lifecycle_state,
        createdAt: new Date(c.created_at * 1000).toISOString(),
        role: 'owner' as const,
      }))),
      ...((collaborated.results || []).map((c) => ({
        id: c.id,
        title: c.title,
        lifecycleState: c.lifecycle_state,
        createdAt: new Date(c.created_at * 1000).toISOString(),
        role: 'collaborator' as const,
        permission: c.permission,
      }))),
    ];

    return NextResponse.json({ contracts });
  } catch (error) {
    console.error('List contracts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 },
    );
  }
}