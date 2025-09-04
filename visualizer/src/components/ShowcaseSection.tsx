'use client';

import dynamic from 'next/dynamic';
import CTA from './CTA';
import ArchitectureExplainer from './ArchitectureExplainer';
import StatsHighlight from './StatsHighlight';

// Dynamic import for 3D component with SSR disabled
const Architecture3D = dynamic(() => import('./Architecture3D'), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] bg-white/20 rounded-2xl animate-pulse flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-white/30 rounded-full mx-auto animate-pulse"></div>
        <p className="text-white/60">Loading 3D Architecture...</p>
      </div>
    </div>
  )
});

export default function ShowcaseSection() {
  const handleCTAClick = () => {
    const el = document.getElementById('upload-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8 mb-16">
      <CTA onClick={handleCTAClick} />
      <Architecture3D />
      <ArchitectureExplainer />
      <StatsHighlight />
    </div>
  );
}
