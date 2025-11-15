import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Header } from '../components/Header';
import { api } from '../services/api/client';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const Notes: FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    loadNotes();
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [tasksCount, fetchedNotesCount] = await Promise.all([
        api.getOpenTasksCount(),
        api.getNotesCount(),
      ]);
      setOpenTasksCount(tasksCount);
      setNotesCount(fetchedNotesCount);
    } catch (err) {
      console.error('Failed to load counts:', err);
    }
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const response = await fetch(`${apiUrl}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!newNote.title.trim()) {
      setError('Titel is verplicht');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const response = await fetch(`${apiUrl}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      setNewNote({ title: '', content: '' });
      setShowNewNoteModal(false);
      await loadNotes();
      await loadCounts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Weet je zeker dat je deze notitie wilt verwijderen?')) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const response = await fetch(`${apiUrl}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      await loadNotes();
      await loadCounts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main">
      {/* Header */}
      <Header
        title="Notities"
        openTasksCount={openTasksCount}
        notesCount={notesCount}
        actions={
          <button
            onClick={() => setShowNewNoteModal(true)}
            className="px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all text-xs uppercase tracking-widest"
          >
            + Nieuwe Notitie
          </button>
        }
      />

      <div className="p-6">
        {/* Results count */}
        {!loading && (
          <div className="mb-4 text-sm text-text-secondary">
            {notes.length} notitie{notes.length !== 1 ? 's' : ''}
          </div>
        )}

        {/* Notes grid */}
        {loading ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-text-muted">Notities laden...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadNotes}
              className="mt-4 px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-text-muted">Geen notities gevonden</p>
            <button
              onClick={() => setShowNewNoteModal(true)}
              className="mt-4 px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all"
            >
              Maak je eerste notitie
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-card shadow-card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-medium text-navy">{note.title}</h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-text-muted hover:text-red-600 transition-colors"
                    title="Verwijderen"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-text-secondary whitespace-pre-wrap mb-4">
                  {note.content}
                </p>
                <div className="text-xs text-text-muted">
                  {new Date(note.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Note Modal */}
      {showNewNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-lg max-w-2xl w-full">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-xl font-light text-navy tracking-wide">Nieuwe Notitie</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Titel *
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  placeholder="Titel van de notitie..."
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Inhoud
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Inhoud van de notitie..."
                  rows={10}
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-card-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewNoteModal(false);
                  setNewNote({ title: '', content: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-button hover:bg-gray-700 transition-colors text-xs uppercase tracking-widest"
              >
                Annuleren
              </button>
              <button
                onClick={createNote}
                className="px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all text-xs uppercase tracking-widest"
              >
                Notitie Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
