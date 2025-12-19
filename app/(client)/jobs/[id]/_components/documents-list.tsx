import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Eye } from "lucide-react";

interface Document {
  id: string;
  name: string;
  type: "certificate" | "pickup" | "invoice";
  uploadedAt: string;
}

interface DocumentsListProps {
  documents: Document[];
  emptyMessage?: string;
}

const typeLabels = {
  certificate: "Certificate",
  pickup: "Pickup Doc",
  invoice: "Invoice",
};

const typeColors = {
  certificate: "bg-green-100 text-green-700",
  pickup: "bg-blue-100 text-blue-700",
  invoice: "bg-purple-100 text-purple-700",
};

export function DocumentsList({
  documents,
  emptyMessage = "No documents yet",
}: DocumentsListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">{doc.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                  variant="secondary"
                  className={typeColors[doc.type]}
                >
                  {typeLabels[doc.type]}
                </Badge>
                <span>{doc.uploadedAt}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Preview</span>
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
