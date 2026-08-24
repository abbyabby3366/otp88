import React from 'react';

export function PaginationBar({
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100]
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#F8FAFC',
        padding: '6px 12px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '11px',
        flexWrap: 'wrap',
        gap: '8px'
      }}
    >
      <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        Showing {startItem} to {endItem} of {totalItems} entries
      </div>

      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {onPageSizeChange && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="sheets-input"
              style={{ padding: '2px 6px', fontSize: '11px', height: '24px' }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className="sheets-btn"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            style={{ padding: '2px 8px', fontSize: '11px', height: '24px', whiteSpace: 'nowrap' }}
          >
            ◀ Prev
          </button>
          <span
            style={{
              fontFamily: 'var(--font-code)',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              display: 'inline-block',
              minWidth: '32px',
              textAlign: 'center'
            }}
          >
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="sheets-btn"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            style={{ padding: '2px 8px', fontSize: '11px', height: '24px', whiteSpace: 'nowrap' }}
          >
            Next ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaginationBar;
