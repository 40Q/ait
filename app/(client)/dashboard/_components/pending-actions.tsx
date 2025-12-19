import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";

interface PendingAction {
  id: string;
  type: "quote";
  title: string;
  description: string;
  href: string;
}

// Mock data - would come from API
const pendingActions: PendingAction[] = [
  {
    id: "1",
    type: "quote",
    title: "Quote Ready for Review",
    description: "Quote #Q-2024-0042 is ready for your review",
    href: "/requests/REQ-001?tab=quote",
  },
];

export function PendingActions() {
  if (pendingActions.length === 0) return null;

  return (
    <div className="space-y-3">
      {pendingActions.map((action) => (
        <Card key={action.id} className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{action.title}</p>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link href={action.href}>
                Review
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
