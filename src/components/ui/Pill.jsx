export function Pill({ children }) {
  return (
    <span className="px-3 py-1 rounded-full bg-elevated/60 border border-border text-sm text-text-lo">
      {children}
    </span>
  );
}