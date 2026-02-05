import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, X, Edit2, Check } from 'lucide-react';

export interface Filter {
  id: string;
  name: string;
  config: {
    searchUrl: string;
  };
}

interface SidebarProps {
  currentFilterId: string | null;
  onFilterSelect: (filter: Filter | null) => void;
  className?: string;
}

export function Sidebar({ currentFilterId, onFilterSelect, className = '' }: SidebarProps) {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Create Form State
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterUrl, setNewFilterUrl] = useState('');

  const loadFilters = async () => {
    try {
      const data = await api.get('/filters');
      setFilters(data);
    } catch (err) {
      console.error('Failed to load filters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilters();
  }, []);

  const handleCreateFilter = async () => {
    if (!newFilterName || !newFilterUrl) return;
    try {
      await api.post('/filters', {
        name: newFilterName,
        config: { searchUrl: newFilterUrl }
      });
      setNewFilterName('');
      setNewFilterUrl('');
      setShowCreateForm(false);
      loadFilters();
    } catch (err) {
      console.error(err);
      alert('Failed to create filter');
    }
  };

  const handleDeleteFilter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this filter?')) return;
    try {
      await api.delete(`/filters/${id}`);
      if (currentFilterId === id) onFilterSelect(null);
      loadFilters();
    } catch (err) {
      console.error(err);
      alert('Failed to delete filter');
    }
  };

  return (
    <aside className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">My Filters</h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            editMode 
              ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {editMode ? <><Check className="h-3 w-3" /> Done</> : <><Edit2 className="h-3 w-3" /> Edit</>}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => onFilterSelect(null)}
          className={`px-4 py-2 rounded-full text-xs font-medium transition-all border ${
            !currentFilterId
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
          }`}
        >
          All Jobs
        </button>
        
        {loading ? (
          <span className="text-xs text-gray-400 p-2">Loading...</span>
        ) : filters.map(filter => (
          <div
            key={filter.id}
            onClick={() => onFilterSelect(filter)}
            className={`group relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all border cursor-pointer select-none ${
              currentFilterId === filter.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                : 'bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100'
            }`}
          >
            {filter.name}
            {editMode && (
              <button
                onClick={(e) => handleDeleteFilter(filter.id, e)}
                className="ml-1 p-0.5 rounded-full hover:bg-red-100 hover:text-red-600 text-gray-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showCreateForm ? (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New Filter Details</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={newFilterName}
              onChange={(e) => setNewFilterName(e.target.value)}
              placeholder="Filter Name (e.g., Remote React)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={newFilterUrl}
              onChange={(e) => setNewFilterUrl(e.target.value)}
              placeholder="LinkedIn Search URL"
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreateFilter}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Save Filter
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full py-3 border border-dashed border-blue-300 bg-blue-50/50 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-50 hover:border-blue-500 hover:shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add New Filter
        </button>
      )}
    </aside>
  );
}
