import React, { useEffect } from "react";

export function InferenceResults({
  previewUrl,
  predictions,
  featureMaps,
  visibleMaps,
  hoveredLayer,
  setHoveredLayer,
  inferenceTime,
  handleReset,
  imageRef,
  detectionImgRef,
  detectionCanvasRef,
  predictionImgRef,
  predictionCanvasRef,
  drawDetectionMini,
}) {
  // Fixed color per class_id
  const BOX_COLORS = ["#39FF14", "#00FFFF", "#00E5FF", "#FFBF00", "#FF00FF"];
  const getClassColor = (pred) => BOX_COLORS[pred.class_id % BOX_COLORS.length];

  // Redraw prediction boxes whenever the user un-hovers, since the canvas remounts
  useEffect(() => {
    if (hoveredLayer === null) {
      // Allow the DOM and aspect-ratio to fully settle
      const timer = setTimeout(() => {
        if (predictionImgRef?.current && predictionImgRef.current.complete) {
          drawDetectionMini();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hoveredLayer, drawDetectionMini, predictionImgRef]);

  const COLS = 6;
  const totalLayers = featureMaps.length || 36;
  const rows = Math.ceil(totalLayers / COLS);

  const getStageInfo = (idx) => {
    const pos = idx / totalLayers;
    if (pos < 0.28)
      return { color: "#FFBF00", label: "Backbone", short: "BACKBONE" };
    if (pos < 0.58) return { color: "#00E5FF", label: "Neck", short: "NECK" };
    if (pos < 0.86) return { color: "#FF00FF", label: "Head", short: "HEAD" };
    return { color: "#39FF14", label: "Output", short: "OUTPUT" };
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[700px] flex-1">
      <div className="flex gap-4 w-full h-full flex-1">
        {/* ---- COLUMN 1: Left Panel (Image, Detect, Log) ---- */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4 overflow-hidden pr-2 border-r border-white/5">
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-all text-[10px] font-mono uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-[14px]">
                arrow_back
              </span>
              New Image
            </button>
            <div className="flex-1"></div>
            <div className="border border-white/20 bg-white/5 px-2 py-0.5 rounded text-white text-[10px] font-mono">
              {inferenceTime}ms
            </div>
          </div>

          {/* Input Image */}
          <div className="relative rounded overflow-hidden border border-white/10 bg-black/50 shrink-0">
            <img
              ref={imageRef}
              src={previewUrl}
              alt="Input"
              className="w-full object-cover opacity-80"
              onLoad={drawDetectionMini}
            />
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <div className="w-1 h-3 rounded bg-electric-blue"></div>
              <span className="text-[8px] font-mono text-white/60 uppercase tracking-widest">
                Input
              </span>
            </div>
          </div>

          {/* Detection Output Panel */}
          <div className="border border-white/10 rounded-lg bg-black/40 p-3 flex flex-col gap-3 shrink-0">
            <div className="text-white/70 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2 pb-2 border-b border-white/10">
              <span className="material-symbols-outlined text-[14px]">
                target
              </span>
              Detection Output
            </div>

            <div className="w-full rounded overflow-hidden border border-white/15 bg-black relative">
              <img
                ref={detectionImgRef}
                src={previewUrl}
                alt="Output"
                className="w-full object-cover"
                onLoad={drawDetectionMini}
              />
              <canvas
                ref={detectionCanvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
            </div>

            {predictions.length > 0 && (
              <div className="flex items-center justify-between text-[10px] font-mono mt-1">
                <span className="text-white/40">Total Detections</span>
                <span className="text-white font-bold">
                  {predictions.length}
                </span>
              </div>
            )}
          </div>

          {/* Detection Log */}
          <div className="flex-1 border border-white/10 rounded-lg bg-black/40 p-3 flex flex-col gap-2 overflow-auto min-h-0">
            <div className="text-white/70 text-[10px] font-mono tracking-widest uppercase flex items-center gap-2 pb-2 border-b border-white/10 shrink-0">
              <span className="material-symbols-outlined text-[14px]">
                list_alt
              </span>
              Detection Log
            </div>
            <div className="flex flex-col gap-1.5 text-[10px] font-mono">
              {predictions.map((pred, idx) => {
                const color = getClassColor(pred);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 py-1 px-2 rounded bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-sm shrink-0"
                      style={{
                        backgroundColor: color,
                        boxShadow: `0 0 6px ${color}80`,
                      }}
                    ></div>
                    <span className="font-bold truncate" style={{ color }}>
                      {pred.class_name.toUpperCase()}
                    </span>
                    <span className="text-white/40 ml-auto tabular-nums">
                      [{pred.confidence.toFixed(2)}]
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ---- COLUMN 2: Pipeline with vertical labels ---- */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden px-2">
          <div className="flex items-center gap-4 mb-4 shrink-0">
            <div className="text-[12px] font-mono text-electric-blue tracking-[0.2em] uppercase font-bold flex items-center gap-3">
              <div className="h-[1px] w-8 bg-electric-blue/50"></div>
              {featureMaps.length}-Layer Pipeline Flow
              <div className="h-[1px] w-8 bg-electric-blue/50"></div>
            </div>
            <div className="flex-1"></div>

            {/* Legend chips */}
            <div className="flex items-center gap-3 border border-white/10 bg-black/40 px-3 py-1.5 rounded-full">
              {[
                { c: "#FFBF00", l: "Backbone" },
                { c: "#00E5FF", l: "Neck" },
                { c: "#FF00FF", l: "Head" },
                { c: "#39FF14", l: "Output" },
              ].map((s) => (
                <div key={s.l} className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{
                      backgroundColor: s.c,
                      boxShadow: `0 0 4px ${s.c}60`,
                    }}
                  ></div>
                  <span
                    className="text-[9px] font-mono uppercase tracking-widest"
                    style={{ color: s.c + "CC" }}
                  >
                    {s.l}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex gap-2 min-h-0 overflow-hidden relative">
            {/* Vertical Labels Area */}
            <div className="w-8 shrink-0 flex flex-col items-center justify-between py-12 border-r border-white/5 opacity-60">
              <div className="h-1/3 flex items-center justify-center -rotate-90 text-[10px] font-mono font-bold tracking-[0.3em] text-[#FFBF00] uppercase min-w-[100px]">
                BACKBONE
              </div>
              <div className="h-1/3 flex items-center justify-center -rotate-90 text-[10px] font-mono font-bold tracking-[0.3em] text-[#00E5FF] uppercase min-w-[100px]">
                NECK
              </div>
              <div className="h-1/3 flex items-center justify-center -rotate-90 text-[10px] font-mono font-bold tracking-[0.3em] text-[#FF00FF] uppercase min-w-[100px]">
                HEAD
              </div>
            </div>

            {/* Pipeline Grid Layout */}
            <div className="flex-1 flex flex-col justify-center py-4 px-6 min-h-0 overflow-hidden relative">
              <div className="bg-black/40 border border-white/10 rounded-xl p-8 flex flex-col justify-center relative w-full h-full shadow-inner">
                {(() => {
                  const allRows = [];
                  for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
                    const isReversed = rowIdx % 2 === 1;
                    const startIdx = rowIdx * COLS;
                    const rowItems = [];
                    for (let c = 0; c < COLS; c++) {
                      const li = startIdx + c;
                      if (li >= totalLayers) break;
                      rowItems.push(li);
                    }

                    // Calculate how many items in this row are visible
                    const rowStartIndex = rowIdx * COLS;
                    const rowEndIndex = Math.min(
                      rowStartIndex + COLS - 1,
                      totalLayers - 1,
                    );
                    const numVisibleInRow = Math.max(
                      0,
                      Math.min(visibleMaps, rowEndIndex + 1) - rowStartIndex,
                    );

                    // Line stats:
                    // Center of first box is at 6.75%
                    // Center spacing between boxes is 17.3%
                    const lineWidth =
                      numVisibleInRow > 1 ? (numVisibleInRow - 1) * 17.3 : 0;

                    allRows.push(
                      <div
                        key={`r${rowIdx}`}
                        className="relative w-full flex justify-center"
                      >
                        {/* Dynamic Horizontal Glowing Line */}
                        {numVisibleInRow > 1 && (
                          <div
                            className="absolute top-1/2 h-[2px] bg-electric-blue shadow-[0_0_12px_#00E5FF] -translate-y-1/2 z-0 transition-all duration-500"
                            style={{
                              left: isReversed ? "auto" : "6.75%",
                              right: isReversed ? "6.75%" : "auto",
                              width: `${lineWidth}%`,
                              opacity: 0.8,
                            }}
                          ></div>
                        )}

                        <div
                          className={`relative z-10 w-full flex ${isReversed ? "flex-row-reverse" : "flex-row"} justify-between items-center`}
                        >
                          {rowItems.map((li) => {
                            const fmap = featureMaps[li];
                            const isActive = li < visibleMaps;
                            const isLast = li === totalLayers - 1;
                            const isHov = hoveredLayer === li;
                            const stg = getStageInfo(li);
                            const nm = fmap ? fmap.name : `L${li}`;
                            const displayName =
                              nm.length > 5 ? nm.slice(0, 4) + ".." : nm;

                            return (
                              <div
                                key={li}
                                className={`w-[13.5%] aspect-square rounded-md bg-[#0a0a0a] flex flex-col items-center justify-center relative transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.9)] overflow-hidden group ${
                                  isLast
                                    ? `shadow-[0_0_20px_${stg.color}80] z-20 hover:scale-[1.1] hover:-translate-y-1`
                                    : isActive
                                      ? "z-20 hover:scale-[1.15] hover:-translate-y-1"
                                      : "opacity-40 border-white/5"
                                } ${isHov && !isLast ? "ring-2 ring-white/60 scale-[1.25] shadow-[0_0_25px_rgba(255,255,255,0.5)] z-30" : ""}`}
                                style={{
                                  border: `1px solid ${isActive ? stg.color + "90" : "#ffffff10"}`,
                                  boxShadow:
                                    isActive && !isHov
                                      ? `0 0 12px ${stg.color}30`
                                      : undefined,
                                  cursor:
                                    isActive && fmap ? "pointer" : "default",
                                }}
                                onMouseEnter={
                                  isActive && fmap
                                    ? () => setHoveredLayer(li)
                                    : undefined
                                }
                                onMouseLeave={
                                  isActive && fmap
                                    ? () => setHoveredLayer(null)
                                    : undefined
                                }
                              >
                                {/* Left-to-right filling hover effect */}
                                {isActive && (
                                  <div 
                                    className="absolute inset-0 w-0 group-hover:w-full transition-all duration-500 ease-out z-0 origin-left"
                                    style={{ backgroundColor: `${stg.color}20` }}
                                  ></div>
                                )}

                                {isActive && !isLast && (
                                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.04] pointer-events-none rounded-md"></div>
                                )}
                                <span
                                  className={`text-[9px] font-mono font-bold leading-none z-10 transition-colors`}
                                  style={
                                    isActive
                                      ? { color: stg.color }
                                      : { color: "#ffffff40" }
                                  }
                                >
                                  {displayName}
                                </span>
                                <span
                                  className={`text-[7px] font-mono leading-none mt-1 z-10 transition-colors ${isActive ? "text-white/50" : "text-white/20"}`}
                                >
                                  {li}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>,
                    );

                    // Dynamic Vertical Turn Line Between Rows
                    const nextRowFirstIndex = (rowIdx + 1) * COLS;
                    const isTurnVisible = visibleMaps > nextRowFirstIndex;

                    if (rowIdx < rows - 1) {
                      allRows.push(
                        <div
                          key={`t${rowIdx}`}
                          className={`flex ${isReversed ? "justify-start" : "justify-end"} w-full shrink-0 relative z-0 -my-[1px]`}
                        >
                          {isTurnVisible && (
                            <div
                              className="bg-electric-blue shadow-[0_0_12px_#00E5FF] w-[2px] transition-all duration-500"
                              style={{
                                height: "min(3vh, 22px)",
                                marginLeft: isReversed
                                  ? "calc(6.75% - 1px)"
                                  : "0",
                                marginRight: !isReversed
                                  ? "calc(6.75% - 1px)"
                                  : "0",
                              }}
                            ></div>
                          )}
                        </div>,
                      );
                    }
                  }
                  return allRows;
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ---- COLUMN 3: Tensor Output ---- */}
        <div className="w-[240px] shrink-0 border-l border-white/5 bg-black/20 flex flex-col min-h-0 pl-3">
          <div className="px-2.5 py-1.5 border-b border-white/10 flex items-center gap-1.5 shrink-0">
            <span className="material-symbols-outlined text-[12px] text-electric-blue">
              memory
            </span>
            <span className="text-[9px] font-mono text-white/50 tracking-widest uppercase">
              Tensor Output
            </span>
          </div>
          <div className="p-2.5 flex flex-col gap-2.5 flex-1 overflow-auto">
            {(() => {
              // If hovering, show that specific feature map layer
              if (
                hoveredLayer !== null &&
                featureMaps &&
                featureMaps[hoveredLayer]
              ) {
                const displayIdx = hoveredLayer;
                const fmap = featureMaps[displayIdx];
                const stagePos = displayIdx / (featureMaps.length || 1);

                let stageLabel = "OUTPUT";
                let stageCol = "#39FF14";
                if (stagePos < 0.28) {
                  stageLabel = "BACKBONE";
                  stageCol = "#FFBF00";
                } else if (stagePos < 0.58) {
                  stageLabel = "NECK";
                  stageCol = "#00E5FF";
                } else if (stagePos < 0.86) {
                  stageLabel = "HEAD";
                  stageCol = "#FF00FF";
                }

                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono text-xs font-bold"
                        style={{ color: stageCol }}
                      >
                        L{displayIdx}
                      </span>
                      <span
                        className="text-[7px] font-mono px-1 py-0.5 rounded"
                        style={{
                          color: stageCol,
                          backgroundColor: stageCol + "15",
                          border: `1px solid ${stageCol}30`,
                        }}
                      >
                        {stageLabel}
                      </span>
                    </div>
                    <div className="text-white text-[10px] font-bold font-mono truncate">
                      {fmap.name}
                    </div>

                    <div className="rounded-lg overflow-hidden border border-white/15 bg-black relative">
                      <img
                        src={`data:image/png;base64,${fmap.base64_image}`}
                        alt={`Layer ${displayIdx}`}
                        className="w-full aspect-square object-cover"
                      />
                    </div>

                    <div className="space-y-1.5 text-[8px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-white/40">SHAPE</span>
                        <span className="text-electric-blue/70">
                          {fmap.shape
                            .replace("[1,", "")
                            .replace("]", "")
                            .trim()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">PARAMS</span>
                        <span className="text-white/60">
                          {fmap.params > 0
                            ? fmap.params >= 1e6
                              ? `${(fmap.params / 1e6).toFixed(1)}M`
                              : fmap.params >= 1000
                                ? `${(fmap.params / 1000).toFixed(1)}K`
                                : fmap.params
                            : "shared"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40">LAYER</span>
                        <span className="text-white/60">
                          {displayIdx + 1} / {featureMaps.length}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${((displayIdx + 1) / (featureMaps.length || 36)) * 100}%`,
                          backgroundColor: stageCol,
                        }}
                      ></div>
                    </div>
                  </>
                );
              }

              // Fallback: If not hovering any layer, show the Final Detection output stats
              return (
                <div className="flex flex-col h-full gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#39FF14]">
                      PREDICTION
                    </span>
                    <span className="text-[7px] font-mono px-1 py-0.5 rounded text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30">
                      FINAL OUTPUT
                    </span>
                  </div>

                  <div className="text-white text-[10px] font-bold font-mono truncate">
                    YOLOv8 Det
                  </div>

                  <div className="rounded-lg overflow-hidden border border-[#39FF14]/30 bg-black relative">
                    <img
                      ref={predictionImgRef}
                      src={previewUrl}
                      alt="Final Output"
                      className="w-full aspect-square object-cover opacity-80"
                      onLoad={drawDetectionMini}
                    />
                    <canvas
                      ref={predictionCanvasRef}
                      className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-2 left-2 flex flex-col z-10">
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest drop-shadow-md">
                        {predictions.length > 0
                          ? "Objects Detected"
                          : "No Objects"}
                      </span>
                      <span className="text-[18px] font-mono text-[#39FF14] leading-none mt-1 drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]">
                        {predictions.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[8px] font-mono mt-2">
                    <div className="flex justify-between">
                      <span className="text-white/40">MODELS</span>
                      <span className="text-electric-blue/70">Detection</span>
                    </div>
                    {predictions.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-white/40">HIGHEST CONF</span>
                        <span className="text-[#39FF14]/90">
                          {Math.max(
                            ...predictions.map((p) => p.confidence),
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/40">TIME</span>
                      <span className="text-white/60">{inferenceTime}ms</span>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 flex flex-col items-center justify-center opacity-40 animate-pulse">
                    <span className="material-symbols-outlined text-xl mb-1">
                      ads_click
                    </span>
                    <span className="text-[7px] tracking-widest text-center">
                      HOVER TUBES TO EXPLORE <br /> TENSORS
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
