import { useState } from 'react';
import { api } from '../lib/api';
import { X, Save, AlertTriangle, Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface SettingsModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cookie.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      await api.post('/config/linkedin-cookie', { cookie });
      setMessage({ type: 'success', text: 'Cookie updated successfully! You can now run the collector.' });
      setCookie('');
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update cookie';
      setMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">System Settings</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Update LinkedIn Cookie</p>
                <p>
                  Paste your new <code>li_at</code> cookie here when the scraper encounters login issues or &quot;Too many redirects&quot; errors.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="cookie-input" className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn Session Cookie (li_at)
              </label>
              <input
                id="cookie-input"
                type="password"
                value={cookie}
                onChange={(e) => setCookie(e.target.value)}
                placeholder="Paste new cookie value..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                required
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Push Notifications Section */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Notifications</h3>
            
            {!isSupported ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                Push notifications are not supported in this browser.
              </p>
            ) : (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isSubscribed ? 'bg-blue-100' : 'bg-gray-200'}`}>
                    {isSubscribed ? <Bell className="h-5 w-5 text-blue-600" /> : <BellOff className="h-5 w-5 text-gray-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {isSubscribed ? 'Push Notifications Active' : 'Push Notifications Inactive'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isSubscribed 
                        ? 'You will be notified about new job matches.' 
                        : 'Enable to receive alerts on your device.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={isSubscribed ? unsubscribe : subscribe}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    isSubscribed 
                      ? 'bg-white text-red-600 border border-gray-200 hover:bg-red-50 hover:border-red-200 shadow-sm' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {isSubscribed ? 'Disable' : 'Enable'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !cookie.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Cookie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Loader2({ className }: { readonly className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
