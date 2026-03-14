import React from "react";
import { API_URL } from "../config";

export function UploadArea({
  fileInputRef,
  sampleImages,
  handleSampleSelect,
  handleFileDrop,
}) {
  return (
    <div className="flex flex-col h-full flex-1 min-h-0 overflow-hidden pb-4">
      {/* Hero Text */}
      <div className="flex flex-wrap justify-between gap-3 px-4 mb-4 shrink-0">
        <div className="flex min-w-72 flex-col gap-2">
          <h1 className="text-white text-5xl font-black leading-tight tracking-widest uppercase animate-flicker">
            YOLO Visualizer
          </h1>
          <p className="text-slate-400 text-lg font-mono leading-normal">
            Drag and drop your images to visualize custom YOLO neural network
            bounding boxes in real-time.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="flex flex-col p-2 mb-4 items-center relative flex-1 min-h-0 justify-center">
        <div
          className="w-full h-full max-h-[400px] max-w-[60%] rounded-sm bg-white p-[1px] shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] transition-shadow duration-300 group glitch-border relative cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith("image/") && handleFileDrop) {
              handleFileDrop(file);
            }
          }}
        >
          <div className="absolute inset-0 bg-black/40 z-[-1]"></div>
          {/* Decorative corners */}
          <div className="crosshair-corner crosshair-tl -mt-2 -ml-2"></div>
          <div className="crosshair-corner crosshair-tr -mt-2 -mr-2"></div>
          <div className="crosshair-corner crosshair-bl -mb-2 -ml-2"></div>
          <div className="crosshair-corner crosshair-br -mb-2 -mr-2"></div>

          {/* System label decorations */}
          <div className="absolute -top-6 right-0 text-white/50 text-xs font-mono tracking-widest">
            SYS.UPL.001 // ACTIVE
          </div>
          <div className="absolute -bottom-6 left-0 text-white/50 text-xs font-mono tracking-widest">
            [DATA_STREAM_READY]
          </div>

          {/* Inner upload area */}
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-sm bg-black px-6 py-6 relative overflow-hidden group-hover:bg-black/90 transition-colors duration-300">
            {/* Dashed inner border */}
            <div className="absolute inset-0 border-[2px] border-dashed border-white/10 m-2 rounded-sm z-0 shadow-[inset_0_0_15px_rgba(0,229,255,0.05)]"></div>
            {/* Scanline animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-electric-blue/0 via-electric-blue/5 to-electric-blue/0 animate-scanline pointer-events-none"></div>

            {/* Upload Icon */}
            <div className="relative flex items-center justify-center size-24 rounded-none bg-black mb-4 border border-white/50 group-hover:border-electric-blue group-hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all z-10">
              <span className="material-symbols-outlined text-5xl text-white group-hover:text-electric-blue transition-colors">
                cloud_upload
              </span>
              <div className="absolute inset-0 border border-electric-blue/30 animate-[ping_2s_ease-in-out_infinite]"></div>
            </div>

            {/* Text */}
            <div className="flex w-full flex-col items-center gap-2 relative z-10">
              <p className="text-white text-2xl font-bold leading-tight tracking-widest uppercase text-center">
                Drag and Drop
              </p>
              <p className="text-slate-400 text-sm font-mono leading-normal text-center max-w-sm">
                Upload your image to analyze with the YOLOv8 neural network
                instantly.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 relative z-10 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-none h-10 px-6 bg-white text-black text-sm font-bold leading-normal tracking-widest uppercase hover:bg-electric-blue transition-all duration-300 shadow-[0_0_10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_15px_rgba(0,229,255,0.5)]"
              >
                Browse files
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Images */}
      <div className="px-4 shrink-0">
        <h3 className="flex items-center text-white text-base font-bold leading-tight tracking-widest uppercase border-b border-slate-800 pb-2 mb-3 font-mono">
          Sample Images // REC
          <span className="ml-3 inline-block size-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sampleImages.map((item, idx) => {
            const filename = typeof item === "string" ? item : item.filename;
            const label = typeof item === "string" ? `IMG_${String(idx + 1).padStart(2, "0")}` : item.label;
            return (
              <div
                key={filename}
                className="flex flex-col gap-1 group cursor-pointer"
                onClick={() => handleSampleSelect(filename)}
              >
                <div
                  className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-none border border-slate-800 group-hover:border-electric-blue group-hover:shadow-[0_0_10px_rgba(0,229,255,0.2)] transition-all overflow-hidden relative grayscale group-hover:grayscale-0 duration-300"
                  style={{
                    backgroundImage: `url("/samples/${filename}")`,
                  }}
                >
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white text-3xl">
                      play_circle
                    </span>
                  </div>
                </div>
                {/* Label below the image */}
                <p className="text-[10px] font-mono text-slate-400 group-hover:text-electric-blue transition-colors truncate tracking-wider px-0.5">
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
