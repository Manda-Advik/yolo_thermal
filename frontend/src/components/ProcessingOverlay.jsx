import React from "react";

export function ProcessingOverlay() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 py-20">
      <div className="relative size-32">
        <div className="absolute inset-0 border border-electric-blue/30 animate-[ping_2s_ease-in-out_infinite]"></div>
        <div className="absolute inset-2 border border-electric-blue/20 animate-[ping_2.5s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-electric-blue animate-pulse">
            neurology
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-white text-xl font-bold tracking-widest uppercase animate-flicker">
          Processing Neural Network
        </p>
        <p className="text-slate-500 text-sm font-mono">
          Forward pass through 36 layers...
        </p>
      </div>
    </div>
  );
}
