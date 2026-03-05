import React from "react";

export function TopNav() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/20 pb-4 mb-8">
      <div className="flex items-center gap-4 text-white">
        {/* Branding Removed */}
      </div>
      <div className="flex flex-1 justify-end gap-8">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-electric-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-electric-blue shadow-[0_0_8px_rgba(0,229,255,0.8)]"></span>
          </span>
          <span className="text-electric-blue text-xs font-mono uppercase tracking-widest border border-electric-blue/50 bg-electric-blue/10 px-3 py-1 rounded-sm shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            Model: Custom YOLOv8-36L
          </span>
        </div>
      </div>
    </header>
  );
}
