'use client';
import { useState } from 'react';
import { Landmark } from 'lucide-react';

/** Logótipo do Governo de Angola. Se a imagem falhar, mostra um símbolo neutro (nunca fica um ícone partido). */
export default function Brand({ logoUrl, height = 48 }: { logoUrl: string; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <div className="brand-fallback flex-shrink-0" style={{ width: height, height }}>
        <Landmark size={height * 0.55} />
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={logoUrl} alt="Insígnia do Governo de Angola" onError={() => setFailed(true)} style={{ height, width: 'auto', maxWidth: height * 3 }} className="flex-shrink-0" />;
}
