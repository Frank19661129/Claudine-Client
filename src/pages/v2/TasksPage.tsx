import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface Task {
  id: string;
  task_number: number;
  formatted_id: string;
  title: string;
  memo?: string;
  delegated_person_name?: string;
  due_date?: string;
  priority: string;
  status: string;
  status_description?: string;
  tags: string[];
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export const TasksPage: FC = () => {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [delegatedToFilter, setDelegatedToFilter] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit and sort states
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [sortConfig, setSortConfig] = useState<{column: string; direction: 'asc' | 'desc'}[]>([]);

  // New task modal
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    memo: '',
    delegated_person_name: '',
    due_date: '',
    priority: 'medium',
    tags: '',
  });

  useEffect(() => {
    loadTasks();
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        method: 'GET',
      });
      if (response.ok) {
        const data = await response.json();
        setNotesCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load notes count:', err);
    }
  };

  useEffect(() => {
    applyFiltersAndSort();
    // Calculate open tasks count
    const openCount = tasks.filter(t =>
      t.status === 'new' || t.status === 'in_progress' || t.status === 'overdue'
    ).length;
    setOpenTasksCount(openCount);
  }, [tasks, statusFilter, priorityFilter, delegatedToFilter, searchTerm, sortConfig]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const response = await fetch(`${apiUrl}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      setTasks(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tasks];

    // Status filter
    if (statusFilter.length > 0) {
      filtered = filtered.filter(task => statusFilter.includes(task.status));
    }

    // Priority filter
    if (priorityFilter.length > 0) {
      filtered = filtered.filter(task => priorityFilter.includes(task.priority));
    }

    // Delegated to filter
    if (delegatedToFilter.length > 0) {
      filtered = filtered.filter(task => {
        if (!task.delegated_person_name) return delegatedToFilter.includes('(Niet gedelegeerd)');
        return delegatedToFilter.includes(task.delegated_person_name);
      });
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(search) ||
        task.formatted_id.toLowerCase().includes(search) ||
        (task.memo && task.memo.toLowerCase().includes(search))
      );
    }

    // Apply sorting
    if (sortConfig.length > 0) {
      filtered.sort((a, b) => {
        for (const { column, direction } of sortConfig) {
          let aVal: any = a[column as keyof Task];
          let bVal: any = b[column as keyof Task];

          // Handle null/undefined
          if (!aVal && !bVal) continue;
          if (!aVal) return direction === 'asc' ? 1 : -1;
          if (!bVal) return direction === 'asc' ? -1 : 1;

          // Compare values
          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredTasks(filtered);
  };

  const getUniqueValues = (field: keyof Task) => {
    const values = new Set<string>();
    tasks.forEach(task => {
      const value = task[field];
      if (Array.isArray(value)) {
        value.forEach(v => values.add(v));
      } else if (value) {
        values.add(String(value));
      }
    });
    return Array.from(values).sort();
  };

  const getUniqueDelegatedTo = () => {
    const values = new Set<string>();
    tasks.forEach(task => {
      if (task.delegated_person_name) {
        values.add(task.delegated_person_name);
      } else {
        values.add('(Niet gedelegeerd)');
      }
    });
    return Array.from(values).sort();
  };

  const toggleFilter = (filterArray: string[], setFilter: (val: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter(v => v !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const handleSort = (column: string) => {
    setSortConfig(prev => {
      const existing = prev.find(s => s.column === column);
      if (existing) {
        if (existing.direction === 'asc') {
          // Change to desc
          return prev.map(s => s.column === column ? { ...s, direction: 'desc' as const } : s);
        } else {
          // Remove this column from sort
          return prev.filter(s => s.column !== column);
        }
      } else {
        // Add new sort column
        return [...prev, { column, direction: 'asc' as const }];
      }
    });
  };

  const getSortIndicator = (column: string) => {
    const sort = sortConfig.find(s => s.column === column);
    if (!sort) return null;
    const index = sortConfig.findIndex(s => s.column === column);
    return (
      <span className="ml-1">
        {sort.direction === 'asc' ? '↑' : '↓'}
        {sortConfig.length > 1 && <sub className="text-xs">{index + 1}</sub>}
      </span>
    );
  };

  const startEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      status: task.status,
      priority: task.priority,
      delegated_person_name: task.delegated_person_name,
      due_date: task.due_date,
      memo: task.memo,
      tags: task.tags,
    });
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setEditForm({});
  };

  const saveEdit = async (taskId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

      // Update status if changed
      if (editForm.status !== undefined) {
        await fetch(`${apiUrl}/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: editForm.status }),
        });
      }

      // Update priority if changed
      if (editForm.priority !== undefined) {
        await fetch(`${apiUrl}/tasks/${taskId}/priority`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priority: editForm.priority }),
        });
      }

      // Update other fields (memo, delegated_to_name, due_date, tags)
      const updateData: any = {};
      if (editForm.memo !== undefined) updateData.memo = editForm.memo;
      if (editForm.delegated_person_name !== undefined) updateData.delegated_to_name = editForm.delegated_person_name;
      if (editForm.due_date !== undefined) updateData.due_date = editForm.due_date;
      if (editForm.tags !== undefined) updateData.tags = editForm.tags;

      if (Object.keys(updateData).length > 0) {
        await fetch(`${apiUrl}/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      }

      // Reload tasks
      await loadTasks();
      setEditingTaskId(null);
      setEditForm({});
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Weet je zeker dat je deze taak wilt verwijderen?')) {
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      // Reload tasks
      await loadTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';
      const response = await fetch(`${apiUrl}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'done' }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      // Reload tasks
      await loadTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const createNewTask = async () => {
    if (!newTask.title.trim()) {
      setError('Titel is verplicht');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8003/api/v1';

      const taskData = {
        title: newTask.title,
        memo: newTask.memo || undefined,
        delegated_to_name: newTask.delegated_person_name || undefined,
        due_date: newTask.due_date || undefined,
        priority: newTask.priority,
        tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [],
      };

      const response = await fetch(`${apiUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      // Reset form and close modal
      setNewTask({
        title: '',
        memo: '',
        delegated_person_name: '',
        due_date: '',
        priority: 'medium',
        tags: '',
      });
      setShowNewTaskModal(false);

      // Reload tasks
      await loadTasks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'text-green-600 bg-green-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      case 'new': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'new': 'Nieuw',
      'in_progress': 'Bezig',
      'overdue': 'Te laat',
      'done': 'Klaar',
      'cancelled': 'Geannuleerd',
    };
    return statusMap[status] || status;
  };

  const formatPriority = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'high': 'Hoog',
      'medium': 'Normaal',
      'low': 'Laag',
    };
    return priorityMap[priority] || priority;
  };

  return (
    <div className="content-body p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-light text-navy">Taken</h1>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all text-xs uppercase tracking-widest"
        >
          + Nieuwe Taak
        </button>
      </div>

      <div>
        {/* Search and filters */}
        <div className="bg-white rounded-card shadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                Zoeken
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Task ID, titel, memo..."
                className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                Status
              </label>
              <div className="relative">
                <div className="border border-card-border rounded-input bg-background p-2 max-h-32 overflow-y-auto">
                  {getUniqueValues('status').map(status => (
                    <label key={status} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={statusFilter.includes(status)}
                        onChange={() => toggleFilter(statusFilter, setStatusFilter, status)}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-navy">{formatStatus(status)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Priority filter */}
            <div>
              <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                Prioriteit
              </label>
              <div className="relative">
                <div className="border border-card-border rounded-input bg-background p-2 max-h-32 overflow-y-auto">
                  {getUniqueValues('priority').map(priority => (
                    <label key={priority} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={priorityFilter.includes(priority)}
                        onChange={() => toggleFilter(priorityFilter, setPriorityFilter, priority)}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-navy">{formatPriority(priority)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Delegated to filter */}
            <div>
              <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                Gedelegeerd aan
              </label>
              <div className="relative">
                <div className="border border-card-border rounded-input bg-background p-2 max-h-32 overflow-y-auto">
                  {getUniqueDelegatedTo().map(person => (
                    <label key={person} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={delegatedToFilter.includes(person)}
                        onChange={() => toggleFilter(delegatedToFilter, setDelegatedToFilter, person)}
                        className="rounded border-gray-300 text-accent focus:ring-accent"
                      />
                      <span className="text-sm text-navy">{person}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {(statusFilter.length > 0 || priorityFilter.length > 0 || delegatedToFilter.length > 0 || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-card-border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-navy uppercase tracking-widest">Actieve filters:</span>
                {statusFilter.map(status => (
                  <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                    Status: {formatStatus(status)}
                    <button onClick={() => toggleFilter(statusFilter, setStatusFilter, status)} className="hover:text-blue-900">×</button>
                  </span>
                ))}
                {priorityFilter.map(priority => (
                  <span key={priority} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">
                    Prioriteit: {formatPriority(priority)}
                    <button onClick={() => toggleFilter(priorityFilter, setPriorityFilter, priority)} className="hover:text-orange-900">×</button>
                  </span>
                ))}
                {delegatedToFilter.map(person => (
                  <span key={person} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded">
                    Persoon: {person}
                    <button onClick={() => toggleFilter(delegatedToFilter, setDelegatedToFilter, person)} className="hover:text-green-900">×</button>
                  </span>
                ))}
                <button
                  onClick={() => {
                    setStatusFilter([]);
                    setPriorityFilter([]);
                    setDelegatedToFilter([]);
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
        <div className="mb-4 text-sm text-text-secondary">
          {filteredTasks.length} van {tasks.length} taken
        </div>

        {/* Tasks table */}
        {loading ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-text-muted">Taken laden...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadTasks}
              className="mt-4 px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all"
            >
              Opnieuw proberen
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-card shadow-card p-12 text-center">
            <p className="text-text-muted">Geen taken gevonden</p>
          </div>
        ) : (
          <div className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-card-border">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('task_number')}
                    >
                      Task ID{getSortIndicator('task_number')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('title')}
                    >
                      Titel{getSortIndicator('title')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      Status{getSortIndicator('status')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('priority')}
                    >
                      Prioriteit{getSortIndicator('priority')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('delegated_person_name')}
                    >
                      Gedelegeerd aan{getSortIndicator('delegated_person_name')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('due_date')}
                    >
                      Deadline{getSortIndicator('due_date')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest">Tags</th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('created_at')}
                    >
                      Aangemaakt{getSortIndicator('created_at')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-navy uppercase tracking-widest">Acties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {filteredTasks.map((task) => {
                    const isEditing = editingTaskId === task.id;
                    return (
                      <tr key={task.id} className="hover:bg-background transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-navy">{task.formatted_id}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-navy font-medium">{task.title}</div>
                          {isEditing ? (
                            <textarea
                              value={editForm.memo || ''}
                              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                              placeholder="Omschrijving..."
                              className="w-full mt-1 px-2 py-1 text-xs border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                              rows={2}
                            />
                          ) : task.memo ? (
                            <div className="text-xs text-text-muted mt-1 line-clamp-2">{task.memo}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editForm.status || task.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="px-2 py-1 text-xs border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              <option value="new">Nieuw</option>
                              <option value="in_progress">Bezig</option>
                              <option value="overdue">Te laat</option>
                              <option value="done">Klaar</option>
                              <option value="cancelled">Geannuleerd</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                              {formatStatus(task.status)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <select
                              value={editForm.priority || task.priority}
                              onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                              className="px-2 py-1 text-xs border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                            >
                              <option value="low">Laag</option>
                              <option value="medium">Normaal</option>
                              <option value="high">Hoog</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {formatPriority(task.priority)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.delegated_person_name || ''}
                              onChange={(e) => setEditForm({ ...editForm, delegated_person_name: e.target.value })}
                              placeholder="Persoon..."
                              className="w-full px-2 py-1 text-xs border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          ) : (
                            task.delegated_person_name || <span className="text-text-muted italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-navy">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm.due_date || ''}
                              onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                              className="w-full px-2 py-1 text-xs border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          ) : (
                            task.due_date || <span className="text-text-muted italic">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.tags?.join(', ') || ''}
                              onChange={(e) => setEditForm({
                                ...editForm,
                                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
                              })}
                              placeholder="tag1, tag2, tag3..."
                              className="w-full px-2 py-1 text-xs border border-card-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                            />
                          ) : task.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {task.tags.map(tag => (
                                <span key={tag} className="inline-flex px-2 py-0.5 bg-accent/10 text-accent text-xs rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-text-muted italic text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-text-muted">
                          {new Date(task.created_at).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(task.id)}
                                className="w-8 h-8 rounded-full text-white cursor-pointer transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden"
                                style={{
                                  background: 'linear-gradient(180deg, #69db7c 0%, #51cf66 50%, #37b24d 100%)',
                                  boxShadow: '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                title="Opslaan"
                              >
                                <span className="absolute top-0 left-0 right-0 h-1/2 rounded-full" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)'}}></span>
                                ✓
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="w-8 h-8 rounded-full text-white cursor-pointer transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden"
                                style={{
                                  background: 'linear-gradient(180deg, #a8a8a8 0%, #8e8e8e 50%, #707070 100%)',
                                  boxShadow: '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                title="Annuleren"
                              >
                                <span className="absolute top-0 left-0 right-0 h-1/2 rounded-full" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)'}}></span>
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {task.status !== 'done' && (
                                <button
                                  onClick={() => completeTask(task.id)}
                                  className="w-8 h-8 rounded-full text-white cursor-pointer transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden"
                                  style={{
                                    background: 'linear-gradient(180deg, #69db7c 0%, #51cf66 50%, #37b24d 100%)',
                                    boxShadow: '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                  }}
                                  title="Taak voltooien"
                                >
                                  <span className="absolute top-0 left-0 right-0 h-1/2 rounded-full" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)'}}></span>
                                  ✓
                                </button>
                              )}
                              <button
                                onClick={() => startEdit(task)}
                                className="w-8 h-8 rounded-full text-white cursor-pointer transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden"
                                style={{
                                  background: 'linear-gradient(180deg, #4dabf7 0%, #339af0 50%, #1c7ed6 100%)',
                                  boxShadow: '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                title="Wijzigen"
                              >
                                <span className="absolute top-0 left-0 right-0 h-1/2 rounded-full" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)'}}></span>
                                ✎
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="w-8 h-8 rounded-full text-white cursor-pointer transition-all duration-300 flex items-center justify-center text-sm relative overflow-hidden"
                                style={{
                                  background: 'linear-gradient(180deg, #ff8787 0%, #ff6b6b 50%, #f03e3e 100%)',
                                  boxShadow: '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                                  e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.25), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = '';
                                  e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.15)';
                                }}
                                title="Verwijderen"
                              >
                                <span className="absolute top-0 left-0 right-0 h-1/2 rounded-full" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)'}}></span>
                                ×
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-card-border">
              <h2 className="text-xl font-light text-navy tracking-wide">Nieuwe Taak Aanmaken</h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Titel *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Titel van de taak..."
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Memo */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Omschrijving
                </label>
                <textarea
                  value={newTask.memo}
                  onChange={(e) => setNewTask({ ...newTask, memo: e.target.value })}
                  placeholder="Beschrijving van de taak..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {/* Two column layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div>
                  <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                    Prioriteit
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="low">Laag</option>
                    <option value="medium">Normaal</option>
                    <option value="high">Hoog</option>
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>

              {/* Delegated to */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Gedelegeerd aan
                </label>
                <input
                  type="text"
                  value={newTask.delegated_person_name}
                  onChange={(e) => setNewTask({ ...newTask, delegated_person_name: e.target.value })}
                  placeholder="Naam van de persoon..."
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-navy mb-2 uppercase tracking-widest">
                  Tags
                </label>
                <input
                  type="text"
                  value={newTask.tags}
                  onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3..."
                  className="w-full px-3 py-2 bg-background border border-card-border rounded-input text-sm text-navy focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <p className="text-xs text-text-muted mt-1">Gescheiden door komma's</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-card-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewTaskModal(false);
                  setNewTask({
                    title: '',
                    memo: '',
                    delegated_person_name: '',
                    due_date: '',
                    priority: 'medium',
                    tags: '',
                  });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-button hover:bg-gray-700 transition-colors text-xs uppercase tracking-widest"
              >
                Annuleren
              </button>
              <button
                onClick={createNewTask}
                className="px-4 py-2 bg-gradient-navy text-white rounded-button hover:shadow-button transition-all text-xs uppercase tracking-widest"
              >
                Taak Aanmaken
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
