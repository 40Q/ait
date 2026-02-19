import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: { height: 24, text: "text-lg" },
  md: { height: 32, text: "text-xl" },
  lg: { height: 40, text: "text-2xl" },
};

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const { height, text } = sizes[size];
  const width = Math.round(height * (142.29 / 92.31));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/ait-logo.svg"
        alt="AIT Logo"
        width={width}
        height={height}
        priority
      />
      {showText && (
        <span className={cn("font-bold text-foreground", text)}>
          <span className="font-normal text-muted-foreground">
            Electronics Recycling
          </span>
        </span>
      )}
    </div>
  );
}
