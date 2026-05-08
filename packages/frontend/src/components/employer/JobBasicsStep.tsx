'use client';

interface JobBasicsStepProps {
  title: string;
  description: string;
  onChange: (field: string, value: string) => void;
}

const EXAMPLE_JOBS = [
  'Label 500 product images for e-commerce',
  'Translate 200 customer reviews to Spanish',
  'Moderate 1000 user-submitted posts',
  'Transcribe 50 customer service calls',
];

export function JobBasicsStep({ title, description, onChange }: JobBasicsStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Job Title</label>
        <input
          value={title}
          onChange={e => onChange('title', e.target.value)}
          placeholder="e.g. Label 500 product images"
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-mono text-slate-400 mb-2 uppercase tracking-wider">Description</label>
        <textarea
          rows={5}
          value={description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Detailed instructions the AI will use to decompose into microtasks…"
          className="w-full bg-slate-800 border border-slate-600 focus:border-emerald-500 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-600 outline-none transition-colors resize-none"
        />
      </div>
      <div>
        <p className="text-xs font-mono text-slate-500 mb-2">Quick fill:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_JOBS.map(ex => (
            <button key={ex} onClick={() => onChange('title', ex)} className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-400 rounded-lg transition-colors">
              {ex.slice(0, 28)}…
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
