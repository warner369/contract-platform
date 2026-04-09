import { nanoid } from 'nanoid';
import type { ContractAction, AuditEntry, ClauseChange, ClauseNote, ConversationThread } from '@/types/contract';

type Dispatch = (action: ContractAction) => void;

function extractClauseId(action: ContractAction): string | undefined {
  switch (action.type) {
    case 'APPLY_CHANGE':
    case 'PROPOSE_CHANGE':
      return (action.payload as ClauseChange).clauseId;
    case 'REJECT_CHANGE':
      return undefined;
    case 'ADD_CLAUSE_NOTE':
    case 'REMOVE_CLAUSE_NOTE':
      return (action.payload as ClauseNote | string) && typeof action.payload === 'object'
        ? (action.payload as ClauseNote).clauseId
        : undefined;
    case 'ADD_THREAD':
      return (action.payload as ConversationThread).clauseId;
    case 'SET_VARIABLE':
      return undefined;
    default:
      return undefined;
  }
}

export function withAudit(
  dispatch: Dispatch,
  action: ContractAction,
  detail: string,
): void {
  dispatch(action);

  const entry: AuditEntry = {
    id: nanoid(),
    action: action.type,
    clauseId: extractClauseId(action),
    detail,
    timestamp: new Date().toISOString(),
  };

  dispatch({ type: 'ADD_AUDIT_ENTRY', payload: entry });
}