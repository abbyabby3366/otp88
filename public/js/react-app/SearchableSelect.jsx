import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Reusable, beautiful searchable dropdown / select component
 * Styled to fit OTP88 spreadsheet & console aesthetic.
 */
function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  includeAllOption = false,
  allLabel = 'All Users',
  allValue = 'ALL',
  getOptionValue = (opt) => opt.value !== undefined ? opt.value : opt._id,
  getOptionLabel = (opt) => opt.label !== undefined ? opt.label : (opt.name || opt.email || opt.username),
  getOptionSubtext = (opt) => opt.subtext !== undefined ? opt.subtext : (opt.email && opt.name ? opt.email : ''),
  getOptionBadge = (opt) => opt.badge !== undefined ? opt.badge : (opt.role || (opt.balanceUsd !== undefined ? `$${(opt.balanceUsd || 0).toFixed(2)}` : '')),
  style = {},
  buttonStyle = {},
  dropdownWidth = '260px',
  disabled = false,
  id
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize options
  const normalizedOptions = useMemo(() => {
    const list = [];
    if (includeAllOption) {
      list.push({
        value: allValue,
        label: allLabel,
        subtext: '',
        badge: '',
        isAll: true
      });
    }

    options.forEach(opt => {
      if (!opt) return;
      if (typeof opt === 'string') {
        list.push({ value: opt, label: opt, subtext: '', badge: '' });
      } else {
        list.push({
          value: getOptionValue(opt),
          label: getOptionLabel(opt) || String(getOptionValue(opt)),
          subtext: getOptionSubtext(opt) || '',
          badge: getOptionBadge(opt) || '',
          raw: opt
        });
      }
    });
    return list;
  }, [options, includeAllOption, allLabel, allValue]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find(opt => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return normalizedOptions;
    const q = query.toLowerCase().trim();
    return normalizedOptions.filter(opt => {
      const labelMatch = (opt.label || '').toLowerCase().includes(q);
      const subMatch = (opt.subtext || '').toLowerCase().includes(q);
      const valMatch = String(opt.value || '').toLowerCase().includes(q);
      return labelMatch || subMatch || valMatch;
    });
  }, [normalizedOptions, query]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto focus search input
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset query and focused index when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[focusedIndex]);
      }
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items && items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const handleSelect = (option) => {
    if (onChange) {
      onChange(option.value, option.raw || option);
    }
    setIsOpen(false);
  };

  const displayText = selectedOption ? selectedOption.label : (placeholder || 'Select...');

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block', userSelect: 'none', ...style }}
      onKeyDown={handleKeyDown}
      id={id}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: disabled ? '#F1F5F9' : '#FFFFFF',
          border: isOpen ? '1px solid #10B981' : '1px solid var(--border-main, #CBD5E1)',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '11px',
          fontWeight: '500',
          color: selectedOption ? 'var(--text-primary, #0F172A)' : 'var(--text-muted, #64748B)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(16, 185, 129, 0.2)' : 'none',
          transition: 'all 0.15s ease',
          minHeight: '26px',
          ...buttonStyle
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 'calc(100% - 18px)' }}>
          {displayText}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: 'var(--text-muted, #64748B)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
            flexShrink: 0
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Floating Searchable Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            width: dropdownWidth || '260px',
            minWidth: '200px',
            background: '#FFFFFF',
            border: '1px solid var(--border-main, #CBD5E1)',
            borderRadius: '6px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInMenu 0.12s ease-out'
          }}
        >
          {/* Embedded Search Input */}
          <div style={{ padding: '6px', borderBottom: '1px solid var(--border-subtle, #E2E8F0)', background: '#F8FAFC' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: 'absolute', left: '8px', color: 'var(--text-muted, #64748B)', pointerEvents: 'none' }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                placeholder={searchPlaceholder}
                style={{
                  width: '100%',
                  padding: '4px 24px 4px 26px',
                  fontSize: '11px',
                  border: '1px solid var(--border-main, #CBD5E1)',
                  borderRadius: '4px',
                  outline: 'none',
                  background: '#FFFFFF',
                  color: 'var(--text-primary, #0F172A)'
                }}
                onClick={(e) => e.stopPropagation()}
              />
              {query && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuery('');
                    if (searchInputRef.current) searchInputRef.current.focus();
                  }}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted, #64748B)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: '0 2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              padding: '4px'
            }}
          >
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 8px', fontSize: '11px', color: 'var(--text-muted, #64748B)', textAlign: 'center' }}>
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value);
                const isFocused = idx === focusedIndex;

                return (
                  <div
                    key={`${opt.value}-${idx}`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '5px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      background: isSelected
                        ? '#ECFDF5'
                        : isFocused
                        ? '#F1F5F9'
                        : 'transparent',
                      color: isSelected ? '#059669' : 'var(--text-primary, #0F172A)',
                      fontWeight: isSelected ? '700' : '500',
                      transition: 'background-color 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', textAlign: 'left', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.label}
                        </span>
                        {opt.isAll && (
                          <span style={{ fontSize: '9px', padding: '1px 4px', background: '#E2E8F0', borderRadius: '3px', color: '#475569' }}>
                            ALL
                          </span>
                        )}
                      </div>
                      {opt.subtext && (
                        <span style={{ fontSize: '10px', color: isSelected ? '#10B981' : 'var(--text-muted, #64748B)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {opt.subtext}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {opt.badge && !opt.isAll && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: opt.badge.startsWith('$') ? '#ECFDF5' : '#F1F5F9',
                            color: opt.badge.startsWith('$') ? '#059669' : '#64748B',
                            border: '1px solid var(--border-subtle, #E2E8F0)'
                          }}
                        >
                          {opt.badge}
                        </span>
                      )}

                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
