import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizes = {
  sm: { icon: 32, text: "text-lg" },
  md: { icon: 40, text: "text-xl" },
  lg: { icon: 48, text: "text-2xl" },
};

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AIT Logo"
      >
        <rect width="100" height="100" rx="12" fill="url(#logo-gradient)" />
        <path d="M20 80L40 20H50L30 80H20Z" fill="white" />
        <path d="M35 80L55 20H65L45 80H35Z" fill="white" />
        <path d="M60 20H90V35H75V80H60V20Z" fill="white" />
        <circle cx="75" cy="15" r="5" fill="white" />
        <defs>
          <linearGradient
            id="logo-gradient"
            x1="0"
            y1="100"
            x2="100"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#003366" />
            <stop offset="1" stopColor="#33cc66" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={cn("font-bold text-foreground", text)}>
          AIT{" "}
          <span className="font-normal text-muted-foreground">
            Electronics Recycling
          </span>
        </span>
      )}
    </div>
  );
}
