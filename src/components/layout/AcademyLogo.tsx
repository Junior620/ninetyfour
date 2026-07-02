import Image from "next/image";
import { cn } from "@/lib/utils";

/** Fichier à placer dans : public/logo.png */
export const LOGO_PATH = "/logo.png";

interface AcademyLogoProps {
  variant?: "header" | "footer" | "sidebar";
  className?: string;
  priority?: boolean;
}

const variants = {
  header: { width: 220, height: 60, className: "h-11 w-auto max-w-[180px] sm:max-w-[220px]" },
  footer: { width: 240, height: 64, className: "h-12 w-auto max-w-[220px]" },
  sidebar: { width: 160, height: 48, className: "h-10 w-auto max-w-[160px]" },
};

export function AcademyLogo({
  variant = "header",
  className,
  priority = false,
}: AcademyLogoProps) {
  const config = variants[variant];

  return (
    <Image
      src={LOGO_PATH}
      alt="Ninety One Foot Academy"
      width={config.width}
      height={config.height}
      className={cn(config.className, className)}
      priority={priority}
    />
  );
}
