import type { FC } from 'react';

export const TasksPage: FC = () => {
  return (
    <>
      {/* Content Header */}
      <div className="content-header">
        <div>
          <div className="content-title">Taken</div>
          <div className="content-subtitle">0 taken totaal</div>
        </div>
        <div className="content-actions">
          <button className="btn btn-primary">
            + Nieuwe Taak
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-body p-8">
        <p className="text-text-muted">Tasks table komt hier...</p>
      </div>
    </>
  );
};
