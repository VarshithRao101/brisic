export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="h-8 w-56 rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-40 rounded-full bg-white/[0.06]" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-2xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="mt-8 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.05]" />
        ))}
      </div>
    </div>
  );
}
