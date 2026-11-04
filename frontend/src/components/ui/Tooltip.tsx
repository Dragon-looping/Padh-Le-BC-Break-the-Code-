interface TooltipProps {
  content: string;
  children: React.ReactElement;
}

// Simple title-based tooltip — no library needed
export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <span title={content} className="inline-flex">
      {children}
    </span>
  );
}
