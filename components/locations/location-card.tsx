"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Building2, Pencil, Star, Trash2, Loader2 } from "lucide-react";

export interface LocationData {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  is_primary: boolean;
}

interface LocationCardProps {
  location: LocationData;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  isDeleting: boolean;
  isSettingPrimary: boolean;
  showDeleteConfirm: boolean;
  onDeleteConfirmChange: (open: boolean) => void;
}

export function LocationCard({
  location,
  onEdit,
  onDelete,
  onSetPrimary,
  isDeleting,
  isSettingPrimary,
  showDeleteConfirm,
  onDeleteConfirmChange,
}: LocationCardProps) {
  const fullAddress = [
    location.address,
    location.city,
    location.state,
    location.zip_code,
  ]
    .filter(Boolean)
    .join(", ")
    .replace(/, ([^,]+)$/, " $1"); // Format: "address, city, state zip"

  return (
    <div className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className="rounded-lg bg-muted p-2">
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{location.name}</p>
          {location.is_primary && (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Star className="mr-1 h-3 w-3 fill-current" />
              Primary
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{fullAddress}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit} title="Edit location">
          <Pencil className="h-4 w-4" />
        </Button>
        {!location.is_primary && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSetPrimary}
            disabled={isSettingPrimary}
            title="Set as primary location"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        <AlertDialog open={showDeleteConfirm} onOpenChange={onDeleteConfirmChange}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{location.name}&quot;?
                This will not affect any existing requests that used this location.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
