import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

interface Note {
  id: string;
  title: string;
  content: string;
  categories?: string[];
  created_at: string;
  updated_at: string;
}

export const NotesPage: FC = () => {
  const { token } = useAuthStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', categories: '' });
  const [showEditNoteModal, setShowEditNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', categories: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);

  useEffect(() => {
    // Only load data when we have a valid token
    if (token) {
      loadNotes();
    }
  }, [token]);

  // Apply filters
  useEffect(() => {
    let filtered = [...notes];

    // Category filter
    if (categoryFilter.length > 0) {
      filtered = filtered.filter(note =>
        note.categories && note.categories.some(cat => categoryFilter.includes(cat))
      );
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(search) ||
        note.content.toLowerCase().includes(search) ||
        (note.categories && note.categories.some(cat => cat.toLowerCase().includes(search)))
      );
    }

    setFilteredNotes(filtered);
  }, [notes, categoryFilter, searchTerm]);


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
      const categories = newNote.categories
        ? newNote.categories.split(',').map(c => c.trim()).filter(c => c.length > 0)
        : [];

      console.log('Creating note with categories:', categories);

      const response = await fetch(`${apiUrl}/notes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newNote.title,
          content: newNote.content,
          categories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      setNewNote({ title: '', content: '', categories: '' });
      setShowNewNoteModal(false);
      await loadNotes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateNote = async () => {
    if (!editingNote || !editForm.title.trim()) {
      setError('Titel is verplicht');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const categories = editForm.categories
        ? editForm.categories.split(',').map(c => c.trim()).filter(c => c.length > 0)
        : [];

      console.log('Updating note with categories:', categories);

      const response = await fetch(`${apiUrl}/notes/${editingNote.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          categories,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      setEditingNote(null);
      setEditForm({ title: '', content: '', categories: '' });
      setShowEditNoteModal(false);
      await loadNotes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startEdit = (note: Note) => {
    setEditingNote(note);
    setEditForm({
      title: note.title,
      content: note.content,
      categories: note.categories?.join(', ') || '',
    });
    setShowEditNoteModal(true);
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
    } catch (err: any) {
      setError(err.message);
    }
  };

  // const toggleMenu = (noteId: string) => {
  //   setOpenMenuId(openMenuId === noteId ? null : noteId);
  // };

  const getUniqueCategories = () => {
    const categories = new Set<string>();
    notes.forEach(note => {
      if (note.categories) {
        note.categories.forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  };

  const toggleCategoryFilter = (category: string) => {
    if (categoryFilter.includes(category)) {
      setCategoryFilter(categoryFilter.filter(c => c !== category));
    } else {
      setCategoryFilter([...categoryFilter, category]);
    }
  };

  return (
    <div className="content-body p-6">
      {/* Header with action button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light text-navy">Notities</h1>
        <button
          onClick={() => setShowNewNoteModal(true)}
          className="px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all text-xs uppercase tracking-widest"
        >
          + Nieuwe Notitie
        </button>
      </div>

      <div>
        {/* Search and filters */}
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                Zoeken
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titel, inhoud, categorie..."
                className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Category filter */}
            <div>
              <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                Categorieën
              </label>
              <div className="relative">
                <div className="border border-card-border rounded-input bg-background p-2 max-h-32 overflow-y-auto">
                  {getUniqueCategories().length === 0 ? (
                    <p className="text-sm text-text-muted italic">Geen categorieën</p>
                  ) : (
                    getUniqueCategories().map(category => (
                      <label key={category} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={categoryFilter.includes(category)}
                          onChange={() => toggleCategoryFilter(category)}
                          className="rounded border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="text-sm text-navy">{category}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {(categoryFilter.length > 0 || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-card-border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-navy uppercase tracking-widest">Actieve filters:</span>
                {categoryFilter.map(category => (
                  <span key={category} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent text-xs rounded">
                    Categorie: {category}
                    <button onClick={() => toggleCategoryFilter(category)} className="hover:text-accent-dark">×</button>
                  </span>
                ))}
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    Zoeken: {searchTerm}
                    <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setCategoryFilter([]);
                    setSearchTerm('');
                  }}
                  className="text-xs text-accent hover:text-accent-dark uppercase tracking-widest"
                >
                  Wis alle filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <div className="mb-4 text-sm text-text-secondary">
            {filteredNotes.length} van {notes.length} notitie{notes.length !== 1 ? 's' : ''}
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
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-text-muted">
              {notes.length === 0 ? 'Geen notities gevonden' : 'Geen notities voldoen aan de filters'}
            </p>
            {notes.length === 0 && (
              <button
                onClick={() => setShowNewNoteModal(true)}
                className="mt-4 px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all"
              >
                Maak je eerste notitie
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-card shadow-card p-6 hover:shadow-lg transition-shadow relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3
                    className="text-lg font-medium text-navy flex-1 pr-2 cursor-pointer hover:text-accent transition-colors"
                    onClick={() => startEdit(note)}
                    title="Klik om te bewerken"
                  >
                    {note.title}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(note)}
                      className="text-navy hover:text-accent transition-colors text-lg leading-none px-2"
                      title="Bewerken"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-text-muted hover:text-red-600 transition-colors text-lg leading-none px-2"
                      title="Verwijderen"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Categories */}
                {note.categories && note.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.categories.map((category, idx) => (
                      <span
                        key={idx}
                        className="inline-flex px-2 py-0.5 bg-accent/10 text-accent text-xs rounded"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}

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

              {/* Categories */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Categorieën
                </label>
                <input
                  type="text"
                  value={newNote.categories}
                  onChange={(e) => setNewNote({ ...newNote, categories: e.target.value })}
                  placeholder="categorie1, categorie2, categorie3..."
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <p className="text-xs text-text-muted mt-1">Gescheiden door komma's</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-card-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewNoteModal(false);
                  setNewNote({ title: '', content: '', categories: '' });
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

      {/* Edit Note Modal */}
      {showEditNoteModal && editingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-lg max-w-2xl w-full">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-xl font-light text-navy tracking-wide">Notitie Bewerken</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Titel *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
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
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="Inhoud van de notitie..."
                  rows={10}
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Categorieën
                </label>
                <input
                  type="text"
                  value={editForm.categories}
                  onChange={(e) => setEditForm({ ...editForm, categories: e.target.value })}
                  placeholder="categorie1, categorie2, categorie3..."
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <p className="text-xs text-text-muted mt-1">Gescheiden door komma's</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-card-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditNoteModal(false);
                  setEditingNote(null);
                  setEditForm({ title: '', content: '', categories: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-button hover:bg-gray-700 transition-colors text-xs uppercase tracking-widest"
              >
                Annuleren
              </button>
              <button
                onClick={updateNote}
                className="px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all text-xs uppercase tracking-widest"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
