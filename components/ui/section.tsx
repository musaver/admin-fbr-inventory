import { cn } from "@/lib/utils";

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  background?: "default" | "subtle" | "gradient";
  id?: string;
}

export function Section({ children, className, background = "default", id }: SectionProps) {
  const backgroundStyles = {
    default: "bg-background",
    subtle: "bg-gradient-subtle",
    gradient: "bg-gradient-hero"
  };

  return (
    <section 
      id={id}
      className={cn(
        "py-16 md:py-24",
        backgroundStyles[background],
        className
      )}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {children}
      </div>
    </section>
  );
}