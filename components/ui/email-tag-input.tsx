"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { parseApEmails, joinApEmails } from "@/lib/utils/ap-emails";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailTagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-invalid"?: boolean;
}

export function EmailTagInput({
  value,
  onChange,
  placeholder = "Add email address...",
  "aria-invalid": ariaInvalid,
}: EmailTagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const emails = parseApEmails(value);

  const addEmail = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email) return;

    if (!EMAIL_REGEX.test(email)) {
      setError(`"${email}" is not a valid email address`);
      return;
    }

    if (emails.includes(email)) {
      setError(`"${email}" is already added`);
      return;
    }

    setError(null);
    onChange(joinApEmails([...emails, email]));
    setInputValue("");
  };

  const removeEmail = (index: number) => {
    const updated = emails.filter((_, i) => i !== index);
    onChange(joinApEmails(updated));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Tab" && inputValue.trim()) {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (pasted.includes(",")) {
      e.preventDefault();
      const parts = pasted.split(",");
      for (const part of parts) {
        addEmail(part);
      }
    }
  };

  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "flex flex-wrap gap-1.5 rounded-md border bg-transparent px-3 py-1.5 shadow-xs transition-[color,box-shadow]",
          "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
          ariaInvalid &&
            "ring-destructive/20 dark:ring-destructive/40 border-destructive"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map((email, index) => (
          <Badge key={index} variant="secondary" className="gap-1 pl-2 pr-1">
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(index);
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={() => {
            if (inputValue.trim()) addEmail(inputValue);
          }}
          placeholder={emails.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 bg-transparent py-0.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
