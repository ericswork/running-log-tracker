// Graceful placeholder shown in place of a chart when there is no data, so the
// dashboard never renders a blank or broken chart.
export function EmptyState({ message = "No runs yet" }: { message?: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
