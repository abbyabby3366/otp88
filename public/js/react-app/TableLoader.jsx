import React from 'react';

/**
 * Reusable Table Loading Row with animated spinner and message.
 * Use inside <tbody> when data is fetching or filtering.
 */
export function TableLoader({ colSpan = 8, message = 'Loading data...', padding = '36px 16px' }) {
  return (
    <tr className="sheets-table-loading-row">
      <td colSpan={colSpan} style={{ textAlign: 'center', padding, background: 'transparent' }}>
        <div className="sheets-table-loader-inner">
          <div className="sheets-spinner" />
          <div className="sheets-loader-text">
            <span>{message}</span>
          </div>
        </div>
      </td>
    </tr>
  );
}

/**
 * Reusable Block Loader for card containers or sub-tab views.
 */
export function BlockLoader({ message = 'Loading...', minHeight = '180px' }) {
  return (
    <div className="sheets-block-loader" style={{ minHeight }}>
      <div className="sheets-spinner" />
      <div className="sheets-loader-text">
        <span>{message}</span>
      </div>
    </div>
  );
}

export default TableLoader;
