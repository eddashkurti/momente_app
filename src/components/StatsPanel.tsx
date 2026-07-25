import { Camera, Clock3, Users } from "lucide-react";
import type { PhotoStats } from "../types/photo";
import { formatRelativeTime } from "../utils/format";

export default function StatsPanel({ stats }: { stats: PhotoStats }) {
  return (
    <section className="stats-panel" aria-label="Statistikat e fotografive">
      <article className="stat-card">
        <Camera aria-hidden="true" />
        <strong>{stats.photoCount}</strong>
        <span>fotografi</span>
      </article>
      <article className="stat-card">
        <Users aria-hidden="true" />
        <strong>{stats.contributorCount}</strong>
        <span>kontribues</span>
      </article>
      <article className="stat-card">
        <Clock3 aria-hidden="true" />
        <strong className="stat-relative">{formatRelativeTime(stats.lastUploadedAt)}</strong>
        <span>fotografia e fundit</span>
      </article>
    </section>
  );
}
