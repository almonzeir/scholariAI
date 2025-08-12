import React from 'react';
import { Link } from 'react-router-dom';

export function HeroSection() {
  return (
    <section className="relative h-screen overflow-hidden flex items-center justify-center text-white bg-bg">
      {/* Background - Gradient fallback since video file doesn't exist yet */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-bg to-accent/20 z-0"></div>
      
      {/* Uncomment when video file is available:
      <video 
        autoPlay 
        muted 
        loop 
        playsInline
        className="absolute inset-0 w-full h-full object-cover brightness-50 z-0 pointer-events-none"
      >
        <source src="/videos/scholarship-bg.mp4" type="video/mp4" />
      </video>
      */}
      
      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/40 z-10"></div>
      
      {/* Hero Content */}
      <div className="relative z-20 text-center px-6 max-w-2xl">
        <h1 className="font-heading font-extrabold leading-tight mb-6">
          Find Your{' '}
          <span className="text-primary bg-grad-primary bg-clip-text text-transparent">
            Fully Funded Scholarship
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-text-lo mb-8 leading-relaxed">
          AI-powered scholarship matching that analyzes your profile and finds the perfect opportunities worldwide
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Primary CTA - Solid gradient button */}
          <Link 
            to="/upload"
            className="group relative px-8 py-4 bg-grad-primary rounded-2xl font-semibold text-white shadow-md hover:shadow-xl transform hover:scale-102 transition-all duration-300 ease-[cubic-bezier(.2,.7,.2,1)] min-w-[200px]"
          >
            <span className="relative z-10">Start Matching</span>
            <div className="absolute inset-0 bg-grad-primary rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-300"></div>
          </Link>
          
          {/* Secondary CTA - Glass button */}
          <Link 
            to="/scholarships"
            className="px-8 py-4 bg-elevated/50 backdrop-blur-md border border-border rounded-2xl font-semibold text-text-hi hover:bg-elevated/70 hover:border-primary/30 transform hover:scale-102 transition-all duration-300 ease-[cubic-bezier(.2,.7,.2,1)] min-w-[200px]"
          >
            Browse All
          </Link>
        </div>
        
        {/* Trust indicators */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-text-lo text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>10,000+ Scholarships</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
            <span>AI-Powered Matching</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span>100% Free</span>
          </div>
        </div>
      </div>
    </section>
  );
}