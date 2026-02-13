import { ExternalLink, Calendar, MapPin } from 'lucide-react';
import type { JobPost } from '../lib/types';

const TECH_BADGE_COLORS: Record<string, string> = {
  react: 'bg-blue-100 text-blue-700',
  node: 'bg-green-100 text-green-700',
  typescript: 'bg-blue-50 text-blue-600',
  javascript: 'bg-yellow-100 text-yellow-700',
  python: 'bg-yellow-50 text-yellow-600',
  java: 'bg-red-100 text-red-700',
  go: 'bg-cyan-100 text-cyan-700',
  rust: 'bg-orange-100 text-orange-700',
  aws: 'bg-orange-50 text-orange-600',
};

const getTechBadgeColor = (tech: string) => {
  const t = tech.toLowerCase();
  for (const [key, color] of Object.entries(TECH_BADGE_COLORS)) {
    if (t.includes(key)) return color;
  }
  return 'bg-gray-100 text-gray-700';
};

export function JobCard({ job }: { job: JobPost }) {
  // Use scrapedAt as the primary date source (moment of scrapping)
  const displayDate = new Date(job.scrapedAt);
  const isValidDate = !isNaN(displayDate.getTime());
  
  const isNew = isValidDate && (new Date().getTime() - displayDate.getTime() < 60000 * 60); // New if < 1 hour

  // Clean up postedAt string (e.g., "2h • Edited • ...")
  const formatPostedAt = (text: string) => {
    if (!text) return '';
    // Take the first part before the first bullet point
    return text.split(/[•·]/)[0].trim();
  };

  const cleanPostedAt = job.postedAt ? formatPostedAt(job.postedAt) : null;

  return (
    <div className={`group bg-white rounded-xl p-6 shadow-sm border transition-all hover:-translate-y-1 hover:shadow-md ${isNew ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{job.company || 'Unknown Company'}</h3>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-800">{job.title || 'Job Offer'}</span>
            {job.mainStack && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                {job.mainStack}
              </span>
            )}
          </div>
        </div>
        <a 
          href={job.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
        >
          View Post <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {job.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {job.description}
        </p>
      )}

      {job.techStack && job.techStack.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.techStack.map((tech) => (
            <span 
              key={tech} 
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTechBadgeColor(tech)}`}
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-4 mt-auto">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {job.location || 'Remote/N/A'}
        </div>
        <span className="text-gray-300">•</span>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {cleanPostedAt ? `Posted ${cleanPostedAt}` : (isValidDate ? displayDate.toLocaleDateString() : 'Date N/A')}
        </div>
      </div>
    </div>
  );
}
