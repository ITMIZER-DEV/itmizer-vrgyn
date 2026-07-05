interface BrandLogoProps {
  showWordmark?: boolean;
}

export function BrandLogo({ showWordmark = true }: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2 shrink-0 overflow-hidden">
      <svg width="20" height="22" viewBox="0 0 20 22" className="shrink-0">
        <polygon
          points="10,0 19,5.5 19,16.5 10,22 1,16.5 1,5.5"
          fill="none"
          stroke="#FF6A00"
          strokeWidth="2"
        />
      </svg>
      {showWordmark && (
        <span className="font-display font-bold text-xl text-foreground whitespace-nowrap tracking-wide">
          <span style={{ color: '#FF6A00' }}>IT</span>MIZER
        </span>
      )}
    </div>
  );
}
