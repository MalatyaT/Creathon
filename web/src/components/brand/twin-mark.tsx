export function TwinMark({ 
  variant = "egitim", 
  className = "",
  size,
  text
}: { 
  variant?: "egitim" | "cocuk";
  className?: string;
  size?: number;
  text?: boolean;
}) {
  const isCocuk = variant === "cocuk";
  
  // Renk tanımlamaları (Görsellerdeki renklere sadık kalınarak)
  const leftColor = isCocuk ? "#8b5cf6" : "#0F9D58"; // Mor veya Yeşil
  const rightColor = isCocuk ? "#0ea5e9" : "#F4B400"; // Mavi veya Sarı
  const textColor = isCocuk ? "#4c1d95" : "#0F9D58"; // Koyu Mor veya Yeşil
  const logoText = isCocuk ? "İkiz Çocuk" : "İkiz Eğitim";

  // Eğer text prop verilmemişse, size prop'u varsa text'i gizle, yoksa göster.
  const showText = text !== undefined ? text : !size;

  if (!showText) {
    // Icon-only version
    return (
      <svg 
        className={className}
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={size ? undefined : { width: 'auto', height: '100%' }}
        aria-hidden="true"
      >
        <circle cx="10" cy="12" r="8" fill={leftColor} />
        <circle
          cx="15"
          cy="12"
          r="8"
          fill={rightColor}
          style={{ mixBlendMode: "multiply" }}
        />
      </svg>
    );
  }

  // Full logo version
  return (
    <svg 
      className={className}
      width={size}
      height={size}
      viewBox="0 0 500 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={size ? undefined : { width: 'auto', height: '100%' }}
    >
      {/* Sol Daire */}
      <circle cx="60" cy="60" r="45" fill={leftColor} style={{ mixBlendMode: "multiply" }} opacity="0.95" />
      
      {/* Sağ Daire */}
      <circle cx="110" cy="60" r="45" fill={rightColor} style={{ mixBlendMode: "multiply" }} opacity="0.95" />
      
      {/* Yazı */}
      <text 
        x="180" 
        y="75" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        fontSize="54" 
        fontWeight="800" 
        letterSpacing="-1.5"
        fill={textColor}
      >
        {logoText}
      </text>
    </svg>
  );
}
