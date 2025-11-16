import { useState, useEffect } from 'react';
import { api } from '../services/api/client';

export const useCounts = () => {
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [inboxCount, setInboxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCounts = async () => {
    try {
      setLoading(true);
      const [tasksCount, fetchedNotesCount, fetchedInboxCount] = await Promise.all([
        api.getOpenTasksCount(),
        api.getNotesCount(),
        api.getInboxCount(),
      ]);
      setOpenTasksCount(tasksCount);
      setNotesCount(fetchedNotesCount);
      setInboxCount(fetchedInboxCount);
    } catch (err) {
      console.error('Failed to load counts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();

    // Reload counts every 30 seconds
    const interval = setInterval(loadCounts, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    openTasksCount,
    notesCount,
    inboxCount,
    loading,
    reload: loadCounts,
  };
};
