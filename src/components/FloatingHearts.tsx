export default function FloatingHearts({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="floating-hearts" aria-hidden="true">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} style={{ "--heart-index": index } as React.CSSProperties}>🤍</span>
      ))}
    </div>
  );
}
