import { useEffect, useState } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import type { User } from './lib/types';
import { ArrowRight, Bell, Sparkles, ShieldCheck, SlidersHorizontal, Target, Zap } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        return JSON.parse(storedUser);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    return null;
  });
  const [route, setRoute] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const navigateTo = (path: string) => {
    if (path === window.location.pathname) return;
    window.history.pushState({}, '', path);
    setRoute(path);
  };

  if (route.startsWith('/dashboard')) {
    return user ? (
      <Dashboard user={user} onLogout={handleLogout} />
    ) : (
      <Auth onLogin={handleLogin} />
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            LinkedIn Alert Hub
          </a>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 sm:flex" aria-label="Primary">
            <a href="#features" className="transition-colors hover:text-slate-900">Features</a>
            <a href="#benefits" className="transition-colors hover:text-slate-900">Benefits</a>
            <a href="#cta" className="transition-colors hover:text-slate-900">Get Started</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/dashboard')}
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 sm:flex"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigateTo('/dashboard')}
              className="flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700"
            >
              Start Tracking
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -top-24 right-12 h-64 w-64 rounded-full bg-indigo-500 blur-[120px]" />
            <div className="absolute bottom-0 left-12 h-72 w-72 rounded-full bg-blue-500 blur-[140px]" />
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-28">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-200">Job intelligence platform</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
                Stay first in line for the roles that fit you.
              </h1>
              <p className="mt-5 text-lg text-slate-200 sm:text-xl">
                LinkedIn Alert Hub collects, filters, and surfaces the most relevant job posts in real time,
                so you can focus on applying with confidence.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => navigateTo('/dashboard')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-indigo-500/20 transition hover:bg-slate-100"
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/10"
                >
                  Explore Features
                </a>
              </div>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-semibold">24/7</p>
                  <p className="text-xs text-slate-300">Continuous collection</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">Live</p>
                  <p className="text-xs text-slate-300">Streamed alerts</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">Focused</p>
                  <p className="text-xs text-slate-300">Custom filters</p>
                </div>
              </div>
            </div>
            <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Realtime job alerts</p>
                  <p className="text-xs text-slate-300">Fresh roles delivered instantly</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-200">
                <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                  <Target className="mt-0.5 h-5 w-5 text-indigo-200" />
                  <div>
                    <p className="font-semibold">Precision targeting</p>
                    <p className="text-xs text-slate-300">Filter by title, location, and seniority.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                  <Zap className="mt-0.5 h-5 w-5 text-indigo-200" />
                  <div>
                    <p className="font-semibold">Instant workflow</p>
                    <p className="text-xs text-slate-300">Launch collection and watch the feed update live.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-2xl bg-white/5 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-200" />
                  <div>
                    <p className="font-semibold">Secure dashboard</p>
                    <p className="text-xs text-slate-300">Private access to your job pipeline.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Features</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Everything you need to manage high-quality job offers.
              </h2>
              <p className="mt-4 text-slate-600">
                Build targeted filters, run collections on demand, and follow the live stream of new roles.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Smart filters',
                  description: 'Save search profiles tailored to your role, location, and seniority.',
                  icon: SlidersHorizontal
                },
                {
                  title: 'Live feed',
                  description: 'See new posts as they arrive with streaming updates inside your dashboard.',
                  icon: Bell
                },
                {
                  title: 'One-click collection',
                  description: 'Launch a collection run instantly without leaving the dashboard.',
                  icon: Zap
                },
                {
                  title: 'Decision-ready signals',
                  description: 'Surface the best opportunities faster with focused job summaries.',
                  icon: Target
                },
                {
                  title: 'Secure access',
                  description: 'Keep your job hunting workflow private and protected behind sign-in.',
                  icon: ShieldCheck
                },
                {
                  title: 'Insightful overview',
                  description: 'Track what is new, what is trending, and what is worth applying to.',
                  icon: Sparkles
                }
              ].map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="benefits" className="scroll-mt-24 py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Benefits</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">
                Spend less time searching and more time applying.
              </h2>
              <p className="mt-4 text-slate-600">
                Keep your job hunt organized with structured filters, real-time updates, and a focused feed.
              </p>
              <div className="mt-8 space-y-4">
                {[
                  'Build focused collections that match your career goals.',
                  'Stay aware of new postings without constant refreshing.',
                  'Prioritize the most relevant opportunities first.',
                  'Maintain momentum with a streamlined workflow from discovery to application.'
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-600" />
                    <p className="text-sm text-slate-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-indigo-50 p-6 shadow-lg">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Sparkles className="h-5 w-5" />
                </span>
                Workflow Snapshot
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">1. Create filters</p>
                  <p className="mt-1 text-xs text-slate-500">Define targeted LinkedIn searches.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">2. Run collection</p>
                  <p className="mt-1 text-xs text-slate-500">Start a scrape and watch jobs stream in.</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">3. Review offers</p>
                  <p className="mt-1 text-xs text-slate-500">Focus on high-quality matches first.</p>
                </div>
              </div>
              <button
                onClick={() => navigateTo('/dashboard')}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700"
              >
                Launch Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section id="cta" className="scroll-mt-24 bg-slate-900 py-16 text-white sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Ready to start?</p>
              <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">
                Bring your job search under control today.
              </h2>
              <p className="mt-4 text-slate-300">
                Access your personalized dashboard to manage filters, run collections, and track offers in real time.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                onClick={() => navigateTo('/dashboard')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Review Features
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>LinkedIn Alert Hub · Built for focused job seekers</p>
          <div className="flex items-center gap-4">
            <a href="#features" className="transition-colors hover:text-slate-700">Features</a>
            <a href="#benefits" className="transition-colors hover:text-slate-700">Benefits</a>
            <button onClick={() => navigateTo('/dashboard')} className="font-semibold text-indigo-600 hover:text-indigo-700">
              Dashboard
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
