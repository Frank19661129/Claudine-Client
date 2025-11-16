import type { FC } from 'react';

export const NotesPage: FC = () => {
  return (
    <>
      {/* Content Header */}
      <div className="content-header">
        <div>
          <div className="content-title">Notities</div>
          <div className="content-subtitle">0 notities totaal</div>
        </div>
        <div className="content-actions">
          <button className="btn btn-primary">
            + Nieuwe Notitie
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="content-body p-8">
        <p className="text-text-muted">Notes lijst komt hier...</p>
      </div>
    </>
  );
};
