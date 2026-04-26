'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ExternalLink, FolderOpen, Briefcase, FileText, Search } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { authStore } from '@/store/authStore';
import { RecruiterSavedResume, jobStore } from '@/store/jobStore';
import { PageShell } from '@/components/ui/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'job' | 'folder';

export default function RecruiterSavedResumesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('folder');
  const [savedResumes, setSavedResumes] = useState<RecruiterSavedResume[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [updatingNoteId, setUpdatingNoteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await jobStore.getRecruiterSavedResumes();
    setSavedResumes(data);
    const drafts: Record<string, string> = {};
    data.forEach((item) => {
      drafts[item.id] = item.note || '';
    });
    setNoteDrafts(drafts);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    const user = authStore.getCurrentUser();
    if (!user || user.role !== 'recruiter') {
      router.push('/login');
      return;
    }
    void loadData();
  }, [router, loadData]);

  const jobGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    savedResumes.forEach((item) => {
      const key = item.jobId || 'unknown-job';
      const label = item.jobTitle ? `${item.jobTitle}${item.jobCompany ? ` - ${item.jobCompany}` : ''}` : 'Unknown Job';
      const current = map.get(key);
      if (!current) {
        map.set(key, { key, label, count: 1 });
      } else {
        current.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [savedResumes]);

  const folderGroups = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    savedResumes.forEach((item) => {
      const key = item.folderSlug;
      const label = item.folderName;
      const current = map.get(key);
      if (!current) {
        map.set(key, { key, label, count: 1 });
      } else {
        current.count += 1;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [savedResumes]);

  useEffect(() => {
    const groups = viewMode === 'job' ? jobGroups : folderGroups;
    if (!groups.length) {
      setSelectedKey('');
      return;
    }
    if (!selectedKey || !groups.some((g) => g.key === selectedKey)) {
      setSelectedKey(groups[0].key);
    }
  }, [viewMode, jobGroups, folderGroups, selectedKey]);

  const visibleResumes = useMemo(() => {
    if (!selectedKey) return [];
    const selected = viewMode === 'job' ? savedResumes.filter((item) => (item.jobId || 'unknown-job') === selectedKey) : savedResumes.filter((item) => item.folderSlug === selectedKey);
    if (!searchTerm.trim()) return selected;
    const target = searchTerm.toLowerCase();
    return selected.filter((item) => `${item.candidateName} ${item.candidateEmail} ${item.note}`.toLowerCase().includes(target));
  }, [savedResumes, selectedKey, viewMode, searchTerm]);

  const handleUpdateNote = async (savedId: string) => {
    const nextNote = String(noteDrafts[savedId] || '').trim();
    try {
      setUpdatingNoteId(savedId);
      await jobStore.updateRecruiterSavedResumeNote(savedId, nextNote);
      toast.success('Note updated');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update note';
      toast.error(message);
    } finally {
      setUpdatingNoteId(null);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-full max-w-6xl px-4 grid lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-4 h-[500px]" />
          <Skeleton className="lg:col-span-8 h-[500px]" />
        </div>
      </div>
    );
  }

  return (
    <PageShell
      variant="recruiter"
      title="Saved Resume Library"
      subtitle="Browse saved resumes by job or by folder"
      actions={
        <Link href="/recruiter/dashboard" className="text-sm text-gray-600 hover:text-[#043927] transition inline-flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      }
    >
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('folder')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === 'folder' ? 'bg-[#043927] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Sort by Folder
        </button>
        <button
          onClick={() => setViewMode('job')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            viewMode === 'job' ? 'bg-[#043927] text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Sort by Job
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4 surface-card p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 inline-flex items-center gap-1.5">
            {viewMode === 'job' ? <Briefcase className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
            {viewMode === 'job' ? 'Jobs' : 'Folders'}
          </h2>

          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {(viewMode === 'job' ? jobGroups : folderGroups).map((group) => (
              <button
                key={group.key}
                onClick={() => setSelectedKey(group.key)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition ${
                  selectedKey === group.key ? 'border-[#043927] bg-[#043927]/5' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-900 truncate">{group.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {group.count} saved resume{group.count !== 1 ? 's' : ''}
                </div>
              </button>
            ))}

            {!loading && (viewMode === 'job' ? jobGroups.length === 0 : folderGroups.length === 0) && (
              <div className="text-sm text-gray-500">
                No saved resumes yet.{' '}
                <Link href="/recruiter/dashboard" className="text-[#043927] hover:underline">
                  Review applications
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 surface-card p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 inline-flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            {viewMode === 'job' ? 'Saved Resumes for Job' : 'Saved Resumes in Folder'}
          </h2>

          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search candidate name, email, or notes..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#043927]/20 focus:border-[#043927]"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
          ) : visibleResumes.length === 0 ? (
            <div className="text-sm text-gray-500">
              No resumes in this selection.
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="ml-2 text-[#043927] hover:underline">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {visibleResumes.map((item) => (
                <div key={item.id} className="surface-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{item.candidateName || 'Candidate'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.candidateEmail || 'No email'}</div>
                      <div className="text-xs text-gray-500 mt-0.5">Folder: {item.folderName}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {viewMode === 'job' && <div className="text-sm font-semibold text-blue-700">Score: {item.applicationScore}%</div>}
                      <a
                        href={`${API_BASE_URL}${item.savedResumeUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[#043927] hover:underline"
                      >
                        Open Resume
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
                    <textarea
                      value={noteDrafts[item.id] || ''}
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => handleUpdateNote(item.id)}
                      disabled={updatingNoteId === item.id}
                      className="mt-2 inline-flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-black disabled:opacity-60 transition text-xs font-medium"
                    >
                      {updatingNoteId === item.id ? 'Updating...' : 'Update Note'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

