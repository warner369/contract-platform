'use client';

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useContract } from '@/components/providers/ContractProvider';

export default function VariablesPanel({ clauseId }: { clauseId: string }) {
  const { state, setVariable } = useContract();
  const relevantVariables = state.variables.filter((v) =>
    v.affectedClauseIds.includes(clauseId),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');

  function handleStartEdit(id: string, currentValue: string) {
    setEditingId(id);
    setEditValue(currentValue);
  }

  function handleSaveEdit(id: string, name: string, oldVar: typeof state.variables[0]) {
    setVariable({
      ...oldVar,
      value: editValue,
    });
    setEditingId(null);
  }

  function handleAddVariable() {
    if (!newName.trim()) return;
    setVariable({
      id: nanoid(),
      name: newName.trim(),
      value: newValue.trim(),
      affectedClauseIds: [clauseId],
    });
    setNewName('');
    setNewValue('');
    setAdding(false);
  }

  return (
    <div className="space-y-3">
      {relevantVariables.length > 0 && (
        <div className="space-y-1.5">
          {relevantVariables.map((v) => (
            <div key={v.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50">
              <span className="text-sm font-medium text-slate-500 min-w-[120px] truncate" title={v.name}>
                {v.name}
              </span>
              {editingId === v.id ? (
                <div className="flex-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 p-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-300"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(v.id, v.name, v);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveEdit(v.id, v.name, v)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <span
                    className="text-sm text-slate-900 cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={() => handleStartEdit(v.id, v.value)}
                    title="Click to edit"
                  >
                    {v.value || <span className="text-slate-300 italic">Empty</span>}
                  </span>
                  {v.affectedClauseIds.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      Affects {v.affectedClauseIds.length} clause{v.affectedClauseIds.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {relevantVariables.length === 0 && !adding && (
        <p className="text-sm text-slate-400">No variables for this clause.</p>
      )}

      {adding ? (
        <div className="space-y-2 p-3 border border-slate-200 rounded-lg">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Variable name"
            className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
            autoFocus
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="w-full p-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddVariable}
              disabled={!newName.trim()}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewName(''); setNewValue(''); }}
              className="px-3 py-1 text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Add variable
        </button>
      )}
    </div>
  );
}