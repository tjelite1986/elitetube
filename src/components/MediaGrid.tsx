import { MediaItem } from "@/lib/db";
import VideoCard from "./VideoCard";

export default function MediaGrid({ items }: { items: MediaItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-yt-muted px-4">
        <p className="text-5xl mb-4">📭</p>
        <p className="text-lg">Ingen media hittad</p>
        <p className="text-sm mt-1">Lägg till media via admin-panelen</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-y-4 sm:gap-y-8 sm:gap-x-4">
      {items.map((item) => (
        <VideoCard key={item.id} item={item} />
      ))}
    </div>
  );
}
