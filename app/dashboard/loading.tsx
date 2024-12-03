export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="mx-auto max-w-7xl pt-20">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="mt-4 h-96 animate-pulse rounded-lg bg-zinc-800" />
      </div>
    </div>
  );
}
