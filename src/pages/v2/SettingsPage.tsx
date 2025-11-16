import type { FC } from 'react';

export const SettingsPage: FC = () => {
  return (
    <div className="content-body p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-light text-navy mb-6">Instellingen</h1>

      <div className="bg-white rounded-card shadow-card p-6 mb-6">
        <h2 className="text-xl font-light text-navy mb-4">Calendar Integration</h2>
        <p className="text-text-muted">Calendar settings komen hier...</p>
      </div>

      <div className="bg-white rounded-card shadow-card p-6">
        <h2 className="text-xl font-light text-navy mb-4">Location</h2>
        <p className="text-text-muted">Location settings komen hier...</p>
      </div>
    </div>
  );
};
