export function Card({ children, className = "" }) {
  return (
    <article className={`bg-elevated/60 backdrop-blur-md border border-border rounded-2xl p-5 shadow-md hover:shadow-xl transition ${className}`}>
      {children}
    </article>
  );
}