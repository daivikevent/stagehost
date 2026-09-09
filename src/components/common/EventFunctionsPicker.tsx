'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Check, Sparkles } from 'lucide-react';

export const DEFAULT_EVENT_FUNCTIONS = [
  { id: 'full_wedding', label: '💍 Full Wedding (All Functions)', isSpecial: true },
  { id: 'sangeet', label: '🎵 Sangeet Night' },
  { id: 'haldi_mehendi', label: '🟡 Haldi & Mehendi' },
  { id: 'wedding_ceremony', label: '👰 Wedding Ceremony' },
  { id: 'reception', label: '🍸 Cocktail & Reception' },
  { id: 'corporate', label: '🏢 Corporate Summit / Gala' },
  { id: 'private_party', label: '🎂 Private Party / Anniversary' },
  { id: 'concert_fest', label: '🎤 Concert / College Fest' },
];

const STORAGE_KEY = 'stagehost_custom_event_functions';

interface EventFunctionsPickerProps {
  value: string; // Comma-separated or single string
  onChange: (value: string) => void;
  label?: string;
  allowCustom?: boolean;
  required?: boolean;
}

export function EventFunctionsPicker({
  value,
  onChange,
  label = 'Event Functions *',
  allowCustom = true,
  required = false,
}: EventFunctionsPickerProps) {
  const [customFunctions, setCustomFunctions] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newFunctionInput, setNewFunctionInput] = useState('');

  // Load custom functions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setCustomFunctions(parsed);
        }
      }
    } catch {}
  }, []);

  // Parse active selections from value string
  const selectedList = (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const toggleFunction = (labelToToggle: string) => {
    let updated: string[];
    if (labelToToggle === '💍 Full Wedding (All Functions)') {
      if (selectedList.includes(labelToToggle)) {
        updated = selectedList.length === 1 ? [] : selectedList.filter((f) => f !== labelToToggle);
      } else {
        updated = [labelToToggle];
      }
    } else {
      const withoutFull = selectedList.filter((f) => f !== '💍 Full Wedding (All Functions)');
      if (withoutFull.includes(labelToToggle)) {
        updated = withoutFull.filter((f) => f !== labelToToggle);
      } else {
        updated = [...withoutFull, labelToToggle];
      }
    }
    onChange(updated.join(', '));
  };

  const handleAddCustom = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newFunctionInput.trim();
    if (!cleanName) return;

    // Add emoji prefix if user didn't type one
    const formatted = cleanName.startsWith('✨') || /[\p{Extended_Pictographic}]/u.test(cleanName)
      ? cleanName
      : `✨ ${cleanName}`;

    if (!customFunctions.includes(formatted)) {
      const nextCustom = [...customFunctions, formatted];
      setCustomFunctions(nextCustom);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom));
      } catch {}
    }

    // Auto-select the newly added custom function
    if (!selectedList.includes(formatted)) {
      const withoutFull = selectedList.filter((f) => f !== '💍 Full Wedding (All Functions)');
      const nextSelected = [...withoutFull, formatted];
      onChange(nextSelected.join(', '));
    }

    setNewFunctionInput('');
    setIsAdding(false);
  };

  const handleRemoveCustom = (fnToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCustom = customFunctions.filter((f) => f !== fnToRemove);
    setCustomFunctions(nextCustom);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCustom));
    } catch {}

    if (selectedList.includes(fnToRemove)) {
      const nextSelected = selectedList.filter((f) => f !== fnToRemove);
      onChange(nextSelected.join(', '));
    }
  };

  return (
    <div className="input-group" style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        <label className="input-label" style={{ marginBottom: 0 }}>
          {label}{' '}
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
            (Select all that apply)
          </span>
        </label>
        {selectedList.length > 0 && (
          <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 700 }}>
            {selectedList.length} Function{selectedList.length > 1 ? 's' : ''} Selected
          </span>
        )}
      </div>

      {/* Pill Chips Container */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {DEFAULT_EVENT_FUNCTIONS.map((opt) => {
          const isSelected = selectedList.includes(opt.label);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleFunction(opt.label)}
              style={{
                padding: '7px 13px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: isSelected
                  ? '1.5px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                background: isSelected
                  ? opt.isSpecial
                    ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                    : 'var(--color-primary)'
                  : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>{isSelected ? '✓' : '+'}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}

        {/* Custom Functions Added by Anchor */}
        {customFunctions.map((customFn) => {
          const isSelected = selectedList.includes(customFn);
          return (
            <button
              key={customFn}
              type="button"
              onClick={() => toggleFunction(customFn)}
              style={{
                padding: '7px 13px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: isSelected
                  ? '1.5px solid var(--color-primary)'
                  : '1px dashed var(--color-border)',
                background: isSelected ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{isSelected ? '✓' : '+'}</span>
              <span>{customFn}</span>
              <span
                onClick={(e) => handleRemoveCustom(customFn, e)}
                title="Remove custom function"
                style={{
                  marginLeft: '3px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  fontSize: '10px',
                }}
              >
                ×
              </span>
            </button>
          );
        })}

        {/* Add Custom Function Button / Inline Input */}
        {allowCustom && (
          isAdding ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--color-primary)',
                padding: '3px 8px 3px 12px',
                borderRadius: '20px',
              }}
            >
              <input
                type="text"
                autoFocus
                placeholder="e.g. Pool Party / Ring Ceremony"
                value={newFunctionInput}
                onChange={(e) => setNewFunctionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  } else if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewFunctionInput('');
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  width: '170px',
                }}
              />
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={() => handleAddCustom()}
                style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '12px' }}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setIsAdding(false);
                  setNewFunctionInput('');
                }}
                style={{ padding: '3px 6px', fontSize: '11px', color: 'var(--color-text-tertiary)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px dashed var(--color-primary)',
                background: 'rgba(108, 92, 231, 0.08)',
                color: 'var(--color-primary)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              <Plus size={13} /> Add Custom Function
            </button>
          )
        )}
      </div>

      {required && selectedList.length === 0 && (
        <span style={{ fontSize: '11px', color: 'var(--color-error, #ef4444)', marginTop: '4px', display: 'block' }}>
          * Please select at least one function
        </span>
      )}
    </div>
  );
}
