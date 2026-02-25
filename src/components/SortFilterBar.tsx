type Props = {
  sort: string;
  length: string;
  category?: string;
  basePath: string;
};

const SORTS = [
  { key: "newest", label: "Latest" },
  { key: "views", label: "Most watched" },
  { key: "duration", label: "Longest" },
];

const LENGTHS = [
  { key: "all", label: "All" },
  { key: "short", label: "< 10 min" },
  { key: "medium", label: "10–20 min" },
  { key: "long", label: "> 20 min" },
];

export default function SortFilterBar({ sort, length, category, basePath }: Props) {
  function buildUrl(newSort: string, newLength: string) {
    const p = new URLSearchParams();
    if (category) p.set("category", category);
    if (newSort !== "newest") p.set("sort", newSort);
    if (newLength !== "all") p.set("length", newLength);
    const str = p.toString();
    return `${basePath}${str ? `?${str}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-2 px-3 sm:px-6 pt-1 pb-2">
      {/* Sort */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {SORTS.map((s) => (
          <a
            key={s.key}
            href={buildUrl(s.key, length)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              sort === s.key
                ? "bg-yt-text text-yt-bg"
                : "bg-yt-surface text-yt-text hover:bg-yt-hover"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      {/* Length filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {LENGTHS.map((l) => (
          <a
            key={l.key}
            href={buildUrl(sort, l.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0 border ${
              length === l.key
                ? "border-yt-text text-yt-text bg-yt-surface2"
                : "border-yt-border text-yt-muted hover:text-yt-text hover:border-yt-text"
            }`}
          >
            {l.label}
          </a>
        ))}
      </div>
    </div>
  );
}
