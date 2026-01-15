"use client";

import { useEffect, useState } from "react";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getSignedUrl, type StorageBucket } from "@/lib/storage/upload";

interface FileInfo {
  path: string;
  name: string;
  url: string | null;
}

interface FileListProps {
  paths: string[];
  bucket: StorageBucket;
}

export function FileList({ paths, bucket }: FileListProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (paths.length === 0) {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    async function loadSignedUrls() {
      const fileInfos = await Promise.all(
        paths.map(async (path) => {
          const name = path.split("/").pop() || path;

          try {
            const url = await getSignedUrl(supabase, bucket, path);
            return { path, name, url };
          } catch {
            return { path, name, url: null };
          }
        })
      );

      setFiles(fileInfos);
      setIsLoading(false);
    }

    loadSignedUrls();
  }, [paths, bucket]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading files...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.path}
          className="flex items-center justify-between gap-2 rounded-md border p-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">{file.name}</span>
          </div>
          {file.url ? (
            <Button variant="ghost" size="sm" asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Unavailable</span>
          )}
        </div>
      ))}
    </div>
  );
}
