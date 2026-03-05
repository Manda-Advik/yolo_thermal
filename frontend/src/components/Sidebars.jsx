import React from "react";

export function Sidebars() {
  return (
    <>
      <div className="fixed top-4 left-4 text-white/50 text-[10px] font-mono z-0 pointer-events-none tracking-widest">
        SYS.INIT.V8.0 // 192.168.1.1 // L-36_ACTIVE
      </div>
      <div className="fixed top-4 right-4 text-white/50 text-[10px] font-mono z-0 pointer-events-none tracking-widest text-right">
        NET_UPLINK // ACTIVE
        <br />
        PING: 12ms
      </div>
      <div className="fixed bottom-4 left-4 text-white/50 text-[10px] font-mono z-0 pointer-events-none tracking-widest">
        LAT: 34.0522 N // LNG: 118.2437 W
      </div>
      <div className="fixed bottom-4 right-4 text-white/50 text-[10px] font-mono z-0 pointer-events-none tracking-widest text-right">
        [SECURE_CONNECTION_ESTABLISHED]
        <br />
        MEM: 0x8F4A2
      </div>
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric-blue to-transparent opacity-50"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-electric-blue to-transparent opacity-50"></div>
      <div className="fixed top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-20"></div>
      <div className="fixed top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-20"></div>
      <div className="fixed left-6 top-24 bottom-24 w-40 flex-col justify-between hidden xl:flex text-slate-400 font-mono text-[10px] z-20 pointer-events-none">
        <div className="flex flex-col gap-1 border-l border-white/20 pl-3 relative">
          <div className="absolute -left-[1.5px] top-0 h-4 w-[3px] bg-electric-blue shadow-[0_0_8px_#00E5FF]"></div>
          <div className="text-white mb-2 uppercase tracking-widest border-b border-white/20 pb-1 w-full flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-electric-blue">
              terminal
            </span>
            Neural Stream
          </div>
          <div className="truncate text-white/80">INIT_MODEL_36L...</div>
          <div className="truncate text-white/80">LOADING_WEIGHTS_V8...</div>
          <div className="truncate text-white/70">SOCKET_CONNECTED...</div>
          <div className="truncate text-white/70">AUTH_OK...</div>
          <div className="truncate text-white/60">AWAITING_UPLINK...</div>
          <div className="truncate text-white/60">MEM_ALLOC_READY...</div>
          <div className="truncate text-electric-blue animate-pulse-glow">
            SYSTEM_STANDBY_0x00
          </div>
        </div>
        <div
          className="flex flex-col h-40 border-l border-white/20 relative pl-2 py-2 text-[8px] justify-between text-white/40 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <div className="absolute -left-[1.5px] top-1/2 h-8 w-[3px] bg-white -translate-y-1/2"></div>
          <div className="flex flex-col animate-scroll-hex">
            <div>0x7F 0x0A 0x1B 0x4C</div>
            <div>0x92 0xFF 0x00 0x3D</div>
            <div>0x11 0x22 0x33 0x44</div>
            <div>0xAA 0xBB 0xCC 0xDD</div>
            <div>0x01 0x02 0x03 0x04</div>
            <div>0xFF 0xEE 0xDD 0xCC</div>
            <div>0x1A 0x2B 0x3C 0x4D</div>
            <div>0x5E 0x6F 0x70 0x81</div>
            <div>0x7F 0x0A 0x1B 0x4C</div>
            <div>0x92 0xFF 0x00 0x3D</div>
            <div>0x11 0x22 0x33 0x44</div>
            <div>0xAA 0xBB 0xCC 0xDD</div>
          </div>
        </div>
        <div className="flex flex-col items-start gap-2 border-l border-white/20 pl-3 relative">
          <div className="absolute -left-[1.5px] bottom-0 h-4 w-[3px] bg-electric-blue shadow-[0_0_8px_#00E5FF]"></div>
          <div className="text-white mb-1 uppercase tracking-widest border-b border-white/20 pb-1 w-full text-left flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-electric-blue">
              memory
            </span>
            Sys Diag
          </div>
          <div className="relative size-16 mt-2">
            <svg className="size-full -rotate-90" viewBox="0 0 36 36">
              <circle
                className="stroke-white/20"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeWidth="1.5"
              ></circle>
              <circle
                className="stroke-white"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="100"
                strokeDashoffset="35"
                strokeWidth="1.5"
              ></circle>
              <circle
                className="stroke-white/20"
                cx="18"
                cy="18"
                fill="none"
                r="12"
                strokeWidth="1"
              ></circle>
              <circle
                className="stroke-electric-blue"
                cx="18"
                cy="18"
                fill="none"
                r="12"
                strokeDasharray="75"
                strokeDashoffset="50"
                strokeWidth="1"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">
              65%
            </div>
          </div>
        </div>
      </div>
      <div className="fixed right-6 top-24 bottom-24 w-40 flex-col justify-between hidden xl:flex text-slate-400 font-mono text-[10px] z-20 pointer-events-none items-end text-right">
        <div className="flex flex-col gap-2 border-r border-white/20 pr-3 relative items-end w-full">
          <div className="absolute -right-[1.5px] top-0 h-4 w-[3px] bg-electric-blue shadow-[0_0_8px_#00E5FF]"></div>
          <div className="text-white mb-2 uppercase tracking-widest border-b border-white/20 pb-1 w-full text-right flex items-center justify-end gap-2">
            Arch.Tree
            <span className="material-symbols-outlined text-[14px] text-electric-blue">
              account_tree
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 w-full">
            <div className="border border-white/30 px-2 py-0.5 text-[8px] rounded-sm bg-black z-10 text-white">
              L0-L12: BACKBONE
            </div>
            <div className="w-[1px] h-3 bg-white/30 mr-8"></div>
            <div className="border border-white/30 px-2 py-0.5 text-[8px] rounded-sm bg-black z-10 text-white">
              L13-L22: NECK
            </div>
            <div className="w-[1px] h-3 bg-white/30 mr-8"></div>
            <div className="border border-white/30 px-2 py-0.5 text-[8px] rounded-sm bg-black z-10 text-white">
              L23-L35: HEAD
            </div>
            <div className="w-[1px] h-3 bg-white/30 mr-8"></div>
            <div className="border border-electric-blue/50 px-2 py-0.5 text-[8px] rounded-sm bg-electric-blue/10 z-10 text-electric-blue shadow-[0_0_5px_rgba(0,229,255,0.3)]">
              OUTPUT_NODES
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 border-r border-white/20 pr-3 relative items-end w-full">
          <div className="absolute -right-[1.5px] bottom-0 h-4 w-[3px] bg-white shadow-[0_0_8px_#FFFFFF]"></div>
          <div className="text-white mb-2 uppercase tracking-widest border-b border-white/20 pb-1 w-full text-right flex items-center justify-end gap-2">
            GPU Perf
            <span className="material-symbols-outlined text-[14px] text-electric-blue">
              speed
            </span>
          </div>
          <div className="h-16 w-full flex items-end justify-end gap-[2px]">
            <div className="w-1.5 bg-white/30 h-[20%]"></div>
            <div className="w-1.5 bg-white/30 h-[35%]"></div>
            <div className="w-1.5 bg-white/40 h-[25%]"></div>
            <div className="w-1.5 bg-white/30 h-[40%]"></div>
            <div className="w-1.5 bg-white/50 h-[65%]"></div>
            <div className="w-1.5 bg-white/40 h-[50%]"></div>
            <div className="w-1.5 bg-white/60 h-[85%]"></div>
            <div className="w-1.5 bg-electric-blue h-[95%] animate-pulse-fast shadow-[0_0_8px_#00E5FF]"></div>
            <div className="w-1.5 bg-white/50 h-[60%]"></div>
            <div className="w-1.5 bg-white/40 h-[45%]"></div>
            <div className="w-1.5 bg-white/30 h-[30%]"></div>
            <div className="w-1.5 bg-white/30 h-[20%]"></div>
          </div>
          <div className="text-[8px] text-electric-blue mt-1 font-bold">
            VRAM: 14.2/16 GB
          </div>
        </div>
      </div>
    </>
  );
}
