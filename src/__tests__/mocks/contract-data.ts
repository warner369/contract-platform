import type {
  ParsedContract,
  Clause,
  ClauseAnalysis,
  ClauseChange,
  ContractState,
  ClauseNote,
  ConversationThread,
  ContractVariable,
  AuditEntry,
  SuggestResponse,
} from '@/types/contract';

export const sampleClause: Clause = {
  id: 'clause-1',
  number: '1',
  title: 'Definitions',
  text: 'In this Agreement, "Confidential Information" means any information disclosed by either party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure.',
  category: 'definitions',
  references: ['clause-3'],
  riskLevel: 'low',
  riskNotes: 'Standard definition clause',
  confidence: 'high',
};

export const sampleClause2: Clause = {
  id: 'clause-2',
  number: '2',
  title: 'Payment Terms',
  text: 'Payment is due within 30 days of receipt of invoice. Late payments shall accrue interest at a rate of 1.5% per month.',
  category: 'payment',
  references: ['clause-1'],
  riskLevel: 'medium',
  riskNotes: 'Short payment window',
};

export const sampleClause3: Clause = {
  id: 'clause-3',
  number: '3',
  title: 'Limitation of Liability',
  text: 'In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages, regardless of the form of action.',
  category: 'liability',
  references: [],
  riskLevel: 'high',
  riskNotes: 'Broad liability exclusion',
};

export const sampleContract: ParsedContract = {
  title: 'Service Agreement between Alpha Corp and Beta Ltd',
  summary: 'A service agreement governing the provision of consulting services between Alpha Corp (Provider) and Beta Ltd (Client), covering payment terms, confidentiality obligations, and liability limitations.',
  parties: ['Alpha Corp', 'Beta Ltd'],
  clauses: [sampleClause, sampleClause2, sampleClause3],
};

export const sampleAnalysis: ClauseAnalysis = {
  explanation:
    'This clause defines what constitutes Confidential Information under the agreement. It covers both explicitly designated and implicitly confidential information, providing broad protection for sensitive data shared between the parties.',
  risks: [
    'The definition is broad and could capture information that the disclosing party did not intend to protect.',
    'No carve-out for information that becomes publicly available through no fault of the receiving party.',
  ],
  opportunities: [
    'Consider adding specific examples of Confidential Information to reduce ambiguity.',
    'Adding a time limit on confidentiality obligations could provide clarity.',
  ],
  relatedClauses: [
    { clauseId: 'clause-3', relationship: 'This definition supports the confidentiality obligations in the Limitation of Liability clause.' },
  ],
  recommendations: [
    'Add a specific carve-out for publicly available information.',
    'Consider adding a duration for confidentiality obligations.',
    'Clarify what "reasonably should be understood" means in practice.',
  ],
};

export const sampleChange: ClauseChange = {
  id: 'change-1',
  clauseId: 'clause-1',
  type: 'modify',
  originalText: sampleClause.text,
  suggestedText:
    'In this Agreement, "Confidential Information" means any information disclosed by either party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure, excluding information that becomes publicly available through no fault of the receiving party.',
  rationale:
    'Added a carve-out for publicly available information to protect the receiving party from claims on information that is already public knowledge.',
  status: 'pending',
};

export const sampleNote: ClauseNote = {
  id: 'note-1',
  clauseId: 'clause-1',
  content: 'Check with legal whether the definition is too broad.',
  visibility: 'internal',
  createdAt: '2026-04-10T10:00:00Z',
};

export const sampleThread: ConversationThread = {
  id: 'thread-1',
  clauseId: 'clause-1',
  messages: [
    {
      id: 'msg-1',
      author: 'You',
      content: 'Should we narrow the definition?',
      createdAt: '2026-04-10T10:30:00Z',
    },
  ],
  resolved: false,
  createdAt: '2026-04-10T10:30:00Z',
};

export const sampleVariable: ContractVariable = {
  id: 'var-1',
  name: 'Payment Terms (days)',
  value: '30',
  affectedClauseIds: ['clause-2'],
};

export const sampleAuditEntry: AuditEntry = {
  id: 'audit-1',
  action: 'APPLY_CHANGE',
  clauseId: 'clause-1',
  detail: 'Accepted change on clause clause-1',
  timestamp: '2026-04-10T10:00:00Z',
};

export const sampleSuggestResponse: SuggestResponse = {
  suggestions: [
    {
      type: 'modify',
      originalText: sampleClause.text,
      suggestedText:
        'In this Agreement, "Confidential Information" means any information disclosed by either party that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and circumstances of disclosure, excluding information that becomes publicly available through no fault of the receiving party.',
      rationale: 'Added a carve-out for publicly available information.',
    },
  ],
  alternatives: [
    {
      text: 'Replace the entire clause with a narrowly-tailored NDA definition.',
      pros: ['Greater clarity', 'Easier to enforce'],
      cons: ['May not cover all scenarios', 'Requires more negotiation'],
    },
  ],
  negotiationTips: [
    'Ask the other party to specify which categories of information they consider confidential.',
    'Propose a sunset provision for confidentiality obligations.',
  ],
};

export const stateWithContract: ContractState = {
  original: sampleContract,
  current: sampleContract,
  changes: [],
  notes: [],
  threads: [],
  variables: [],
  auditLog: [],
  lifecycleState: 'structured',
  selectedClauseId: null,
  isLoading: false,
  error: null,
};