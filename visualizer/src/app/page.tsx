'use client';

import Footer from '~/components/Footer';
import Header from '~/components/Header';
import Hero from '~/components/Hero';
import ShowcaseSection from '~/components/ShowcaseSection';
import dynamic from 'next/dynamic';

const InteractiveSection = dynamic(() => import('~/components/InteractiveSection'), {
  ssr: false,
  loading: () => <div className="h-96 bg-white/20 rounded-2xl animate-pulse" />
});

export default function HomePage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-amber-50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-200/30 via-rose-200/30 to-amber-200/30 animate-gradient-x"></div>
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-rose-300/20 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-300/15 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-conic from-transparent via-rose-300/8 to-transparent rounded-full animate-spin-slow"></div>
      </div>
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Hero />

        {/* Showcase Sections */}
        <ShowcaseSection />

        {/* Interactive Analysis Section */}
          <InteractiveSection />
      </main>
      <Footer />
    </div>
  );
}
