import type { FC } from 'react';

export const InboxPage: FC = () => {
  return (
    <>
      {/* Content Header */}
      <div className="content-header">
        <div>
          <div className="content-title">Inbox</div>
          <div className="content-subtitle">0 items</div>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-body p-8">
        <p className="text-text-muted">Inbox items komen hier...</p>
      </div>
    </>
  );
};
