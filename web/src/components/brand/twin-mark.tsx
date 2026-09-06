export function TwinMark({ 
  variant = "egitim", 
  className = "" 
}: { 
  variant?: "egitim" | "cocuk";
  className?: string;
}) {
  const isCocuk = variant === "cocuk";
  
  // Renk tanımlamaları (Görsellerdeki renklere sadık kalınarak)
  const leftColor = isCocuk ? "#8b5cf6" : "#0F9D58"; // Mor veya Yeşil
  const rightColor = isCocuk ? "#0ea5e9" : "#F4B400"; // Mavi veya Sarı
  const textColor = isCocuk ? "#4c1d95" : "#0F9D58"; // Koyu Mor veya Yeşil
  const text = isCocuk ? "İkiz Çocuk" : "İkiz Eğitim";

  return (
    <svg 
      className={className}
      viewBox="0 0 400 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 'auto', height: '100%' }}
    >
      {/* Sol Daire */}
      <circle cx="60" cy="60" r="45" fill={leftColor} style={{ mixBlendMode: "multiply" }} opacity="0.95" />
      
      {/* Sağ Daire */}
      <circle cx="110" cy="60" r="45" fill={rightColor} style={{ mixBlendMode: "multiply" }} opacity="0.95" />
      
      {/* Kesleşim efekti için daha gerçekçi blend mode tarayıcı tarafından desteklenir */}
      
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
        {text}
      </text>
    </svg>
  );
}
