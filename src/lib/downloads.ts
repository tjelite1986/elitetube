// In-memory download job tracker (persists within the same Node.js process)
export type DownloadJob = {
  status: "pending" | "downloading" | "done" | "error";
  progress: string;
  error?: string;
  filename?: string;
};

const jobs = new Map<number, DownloadJob>();

export function getJob(mediaId: number): DownloadJob | null {
  return jobs.get(mediaId) ?? null;
}

export function setJob(mediaId: number, job: DownloadJob) {
  jobs.set(mediaId, job);
}
