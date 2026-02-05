import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import type { Filter } from './Sidebar';
import { JobCard } from './JobCard';
import type { Job } from './JobCard';
import { api, getToken } from '../lib/api';
import { Play, Loader2, LogOut, Search } from 'lucide-react';
import type { User } from '../lib/types';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentFilter, setCurrentFilter] = useState<Filter | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'running' | 'disconnected'>('connecting');
  const [isRunningFilter, setIsRunningFilter] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load initial jobs (history)
  const loadHistory = async () => {
    try {
      setLoading(true);
      const query = currentFilter ? `?filterId=${currentFilter.id}` : '';
      const data = await api.get(`/posts${query}`);
      setJobs(data);
    } catch (err) {
      console.error('Failed to load job history', err);
    } finally {
      setLoading(false);
    }
  };

  // SSE Connection
  const connectSSE = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const token = getToken();
    let url = `/api/subscribe?token=${token}`;
    if (currentFilter) {
      url += `&filterId=${currentFilter.id}`;
    }

    const es = new EventSource(url);
    eventSourceRef.current = es;

    setConnectionStatus('connecting');

    es.onopen = () => {
      setConnectionStatus('connected');
    };

    es.addEventListener('status', (event) => {
      const status = JSON.parse(event.data);
      setIsRunningFilter(Boolean(status.running));
      setConnectionStatus(status.running ? 'running' : 'connected');
    });

    es.addEventListener('job', (event) => {
      const job = JSON.parse(event.data);
      setJobs(prev => {
        if (prev.find(j => j.url === job.url)) return prev;
        return [job, ...prev];
      });
    });

    es.onerror = () => {
      setConnectionStatus('disconnected');
    };
  };

  useEffect(() => {
    loadHistory();
    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [currentFilter]);

  const handleRunCollection = async () => {
    if (!currentFilter) return;
    setIsRunningFilter(true);
    
    try {
      await api.post('/collect', {
        url: currentFilter.config.searchUrl,
        filterId: currentFilter.id
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start collection';
      alert(message);
      setIsRunningFilter(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">Job Alert Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 bg-gray-100 rounded-full px-3 py-1.5">
            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
              {getInitials(user.username || 'User')}
            </div>
            <span className="text-sm font-medium text-gray-700">{user.username}</span>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Sidebar
                currentFilterId={currentFilter?.id || null}
                onFilterSelect={setCurrentFilter}
              />
            </div>
          </div>

          {/* Main Feed */}
          <main className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[500px]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Feed</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentFilter ? `Filter: ${currentFilter.name}` : 'Showing all collected jobs'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                    connectionStatus === 'running' ? 'bg-green-100 text-green-700' :
                    connectionStatus === 'connected' ? 'bg-blue-50 text-blue-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${
                      connectionStatus === 'running' ? 'bg-green-500 animate-pulse' :
                      connectionStatus === 'connected' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`} />
                    {connectionStatus === 'running' ? 'Running Collection' : 
                     connectionStatus === 'connected' ? 'Live Connected' : 
                     'Disconnected'}
                  </div>

                  {currentFilter && (
                    <button
                      onClick={handleRunCollection}
                      disabled={isRunningFilter}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        isRunningFilter
                          ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                          : 'bg-white border border-gray-200 text-green-600 hover:bg-green-50 hover:border-green-200 shadow-sm hover:shadow'
                      }`}
                    >
                      {isRunningFilter ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 fill-current" />
                      )}
                      {isRunningFilter ? 'Running...' : 'Run Filter'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500">Loading jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      {currentFilter 
                        ? "This filter hasn't collected any jobs yet. Try running the collector." 
                        : "No jobs have been collected yet. Create a filter and run it to get started."}
                    </p>
                    {currentFilter && !isRunningFilter && (
                      <button
                        onClick={handleRunCollection}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Run Collector Now
                      </button>
                    )}
                  </div>
                ) : (
                  jobs.map((job, index) => (
                    <div key={job.id || index} className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                      <JobCard job={job} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
