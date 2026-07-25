import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyGallery({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`empty-state${compact ? " empty-state-compact" : ""}`}>
      <Heart size={30} strokeWidth={1.4} aria-hidden="true" />
      <h2>Ende nuk janë ndarë fotografi.</h2>
      <p>Bëhu i pari që ndan një kujtim nga kjo ditë e veçantë.</p>
      {!compact && (
        <Link className="button button-primary" to="/upload">
          Ndaj momentet e tua
        </Link>
      )}
    </div>
  );
}
