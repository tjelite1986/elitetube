export default function CookieExpiredBanner() {
  return (
    <div className="w-full bg-amber-950 border border-amber-700 rounded-xl p-4 flex gap-3">
      <div className="shrink-0 mt-0.5">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-amber-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-amber-300 font-medium text-sm">YouTube cookies have expired</p>
        <p className="text-amber-400/80 text-xs mt-1 leading-relaxed">
          Export a fresh <code className="bg-amber-900/60 px-1 rounded">cookies.txt</code> from your browser and place it in the Docker volume:
        </p>
        <pre className="text-amber-400/70 text-xs mt-2 bg-amber-900/40 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all">
{`sudo cp cookies.txt $(docker volume inspect elitetube-data --format '{{.Mountpoint}}')/cookies.txt
sudo chown 1001:1001 $(docker volume inspect elitetube-data --format '{{.Mountpoint}}')/cookies.txt`}
        </pre>
      </div>
    </div>
  );
}
