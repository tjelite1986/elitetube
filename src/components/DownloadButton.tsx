"use client";

import { useState, useEffect, useRef } from "react";

type JobStatus = {
  status: "idle" | "pending" | "downloading" | "done" | "error";
  progress?: string;
  error?: string;
  filename?: string;
};

export default function DownloadButton({ mediaId }: { mediaId: number }) {
  const [job, setJob] = useState<JobStatus>({ status: "idle" });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/media/${mediaId}/download`);
      if (!res.ok) return;
      const data: JobStatus = await res.json();
      setJob(data);
      if (data.status === "done" || data.status === "error") {
        stopPoll();
        if (data.status === "done") {
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    } catch { /* ignore */ }
  };

  // Check status on mount; start polling if already in progress
  useEffect(() => {
    fetchStatus().then(() => {
      setJob(prev => {
        if (prev.status === "pending" || prev.status === "downloading") {
          if (!pollRef.current) pollRef.current = setInterval(fetchStatus, 2000);
        }
        return prev;
      });
    });
    return stopPoll;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaId]);

  const startDownload = async () => {
    try {
      const res = await fetch(`/api/media/${mediaId}/download`, { method: "POST" });
      if (!res.ok) return;
      setJob({ status: "pending", progress: "Starting download..." });
      if (!pollRef.current) pollRef.current = setInterval(fetchStatus, 2000);
    } catch { /* ignore */ }
  };

  if (job.status === "done") {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Saved as local file
      </div>
    );
  }

  if (job.status === "error") {
    return (
      <div className="flex flex-col gap-1">
        <button
          onClick={startDownload}
          className="flex items-center gap-2 text-red-400 text-sm hover:text-red-300 transition-colors"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
          Download failed — retry
        </button>
        {job.error && <p className="text-xs text-yt-muted ml-6">{job.error}</p>}
      </div>
    );
  }

  if (job.status === "pending" || job.status === "downloading") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-yt-muted text-sm">
          <div className="w-3 h-3 border-2 border-yt-muted border-t-white rounded-full animate-spin shrink-0" />
          Downloading...
        </div>
        {job.progress && (
          <p className="text-xs text-yt-muted font-mono ml-5 truncate max-w-xs">{job.progress}</p>
        )}
      </div>
    );
  }

  // idle
  return (
    <button
      onClick={startDownload}
      className="flex items-center gap-2 bg-yt-surface border border-yt-border text-yt-muted hover:text-yt-text px-3 py-2 rounded-lg text-sm transition-colors"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Save to library
    </button>
  );
}
