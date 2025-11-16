import type { FC } from 'react';

export const MonitorPage: FC = () => {
  return (
    <>
      {/* Content Header */}
      <div className="content-header">
        <div>
          <div className="content-title">Monitor</div>
          <div className="content-subtitle">API transacties</div>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-body p-8">
        <p className="text-text-muted">Monitor data komt hier...</p>
      </div>
    </>
  );
};
