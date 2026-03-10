import { Card, CardContent, CardHeader } from "@/frontend/components/ui/card";
import { Skeleton } from "@/frontend/components/ui/skeleton";

export function LoadingCard() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <Skeleton className="h-96 w-full" />
      </CardContent>
    </Card>
  );
}
