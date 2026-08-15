import React from 'react';

/**
 * Full viewport or container page loader for session boot & seamless navigation.
 */
export default function PageLoader({ message = 'Loading OTP88 Platform...', subMessage = 'Connecting to MongoDB Atlas & Gateways...' }) {
  return (
    <div className="sheets-page-loader">
      <div className="sheets-page-loader-card">
        <div className="sheets-page-loader-logo">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#10B981" />
            <path d="M7 12L10 15L17 8" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="sheets-spinner sheets-spinner-lg" />
        <div className="sheets-page-loader-title">{message}</div>
        {subMessage && <div className="sheets-page-loader-sub">{subMessage}</div>}
      </div>
    </div>
  );
}
