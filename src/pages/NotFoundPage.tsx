import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="page-container narrow-page closed-state">
      <span className="eyebrow">404</span>
      <h1>Kjo faqe nuk u gjet.</h1>
      <Link className="button button-primary" to="/"><ArrowLeft size={18} /> Kthehu në ballinë</Link>
    </section>
  );
}
