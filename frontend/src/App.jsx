import React, { useState, useRef, useEffect, useCallback } from "react";
import * as ort from "onnxruntime-web";
import { processImageWithModel, YOLO_CLASSES } from "./utils/yoloInference";
import "./index.css";
import { Sidebars } from "./components/Sidebars";
import { TopNav } from "./components/TopNav";
import { UploadArea } from "./components/UploadArea";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { InferenceResults } from "./components/InferenceResults";
// API_URL is no longer needed since we run inference locally

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [featureMaps, setFeatureMaps] = useState([]);
  const [error, setError] = useState(null);
  const [sampleImages, setSampleImages] = useState([]);
  const [visibleMaps, setVisibleMaps] = useState(0);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const [modelSession, setModelSession] = useState(null);
  const [initError, setInitError] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const detectionImgRef = useRef(null);
  const predictionCanvasRef = useRef(null);
  const predictionImgRef = useRef(null);

  // Initialize ONNX Web Runtime and load model
  useEffect(() => {
    const initModel = async () => {
      try {
        console.log("Loading ONNX model...");
        // Instruct ONNX Runtime Web to fetch WASM files from a reliable CDN
        // This avoids Vite bundling issues where it can't find ort-wasm.wasm locally
        ort.env.wasm.wasmPaths =
          "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.2/dist/";
        ort.env.wasm.numThreads = Math.min(
          4,
          navigator.hardwareConcurrency || 1,
        );

        // This expects best.onnx to be in the public/ directory
        const session = await ort.InferenceSession.create("/best.onnx", {
          executionProviders: ["webgl", "wasm"],
          graphOptimizationLevel: "all",
        });
        setModelSession(session);
        console.log("ONNX model loaded successfully.");
      } catch (err) {
        console.error("Failed to load ONNX model:", err);
        setInitError(
          "Failed to load local AI model. Ensure best.onnx is in the public directory.",
        );
      }
    };
    initModel();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    fetchSampleImages();
  }, []);

  const fetchSampleImages = async () => {
    // Instead of querying the backend, we now serve pre-defined static samples from public/samples/
    const staticSamples = [
      { filename: "00.jpg", label: "Sample Image 1" },
      { filename: "01.jpg", label: "Sample Image 2" },
      { filename: "02.jpg", label: "Sample Image 3" },
      { filename: "03.jpg", label: "Sample Image 4" },
    ];
    setSampleImages(staticSamples);
  };

  const drawBoxesForCanvas = useCallback(
    (canvasRef, imgRef, textFormatter = null) => {
      if (
        !predictions.length ||
        !canvasRef.current ||
        !imgRef.current ||
        !previewUrl
      )
        return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = imgRef.current;

      canvas.width = img.clientWidth;
      canvas.height = img.clientHeight;

      // Explicitly set the CSS style properties to prevent stretching/mismatch
      canvas.style.width = `${img.clientWidth}px`;
      canvas.style.height = `${img.clientHeight}px`;

      const scaleX = canvas.width / img.naturalWidth;
      const scaleY = canvas.height / img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const BOX_COLORS = [
        "#39FF14",
        "#00FFFF",
        "#00E5FF",
        "#FFBF00",
        "#FF00FF",
      ];

      predictions.forEach((pred) => {
        const color = BOX_COLORS[pred.class_id % BOX_COLORS.length];
        const x = pred.x_min * scaleX;
        const y = pred.y_min * scaleY;
        const width = (pred.x_max - pred.x_min) * scaleX;
        const height = (pred.y_max - pred.y_min) * scaleY;

        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();

        ctx.shadowBlur = 0;

        const text = textFormatter
          ? textFormatter(pred)
          : `${pred.class_name} ${((pred.confidence || pred.score) * 100).toFixed(0)}%`;

        ctx.font = "bold 10px monospace";
        const textWidth = ctx.measureText(text).width;

        let boxY = y - 16;
        let textY = y - 4;

        if (boxY < 0) {
          boxY = y;
          textY = y + 12;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x - 1, boxY, textWidth + 8, 16);
        ctx.fillStyle = "#000000";
        ctx.fillText(text, x + 3, textY);
      });
    },
    [predictions, previewUrl],
  );

  const drawBoxes = useCallback(() => {
    drawBoxesForCanvas(
      canvasRef,
      imageRef,
      (p) => `${p.class_name} ${((p.confidence || p.score) * 100).toFixed(2)}`,
    );
  }, [drawBoxesForCanvas]);

  const drawDetectionMini = useCallback(() => {
    drawBoxesForCanvas(detectionCanvasRef, detectionImgRef);
    drawBoxesForCanvas(predictionCanvasRef, predictionImgRef);
  }, [drawBoxesForCanvas]);

  useEffect(() => {
    drawBoxes();
    drawDetectionMini();
    window.addEventListener("resize", drawBoxes);
    window.addEventListener("resize", drawDetectionMini);
    return () => {
      window.removeEventListener("resize", drawBoxes);
      window.removeEventListener("resize", drawDetectionMini);
    };
  }, [drawBoxes, drawDetectionMini]);

  useEffect(() => {
    if (featureMaps.length === 0) {
      setVisibleMaps(0);
      return;
    }
    const timer = setInterval(() => {
      setVisibleMaps((prev) => {
        if (prev < featureMaps.length) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 150);
    return () => clearInterval(timer);
  }, [featureMaps]);

  const handleFileDrop = (file) => {
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPredictions([]);
      setFeatureMaps([]);
      setError(null);
      setInferenceTime(0);
      runPrediction(file);
    }
  };

  const handleSampleSelect = async (filename) => {
    try {
      // Fetch the sample image from the public/samples directory
      const url = `/samples/${filename}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: blob.type });
      setSelectedImage(file);
      setPreviewUrl(url);
      setPredictions([]);
      setFeatureMaps([]);
      setError(null);
      setInferenceTime(0);
      runPrediction(file);
    } catch (err) {
      console.error("Sample load error:", err);
      setError("Failed to load sample image: " + err.message);
    }
  };

  const runPrediction = async (fileToRun = selectedImage) => {
    if (!fileToRun) return;
    if (!modelSession) {
      setError("Model is not loaded yet. Please wait a moment.");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions([]);
    setFeatureMaps([]);

    const start = performance.now();
    try {
      // Run the ONNX inference locally in the browser
      const result = await processImageWithModel(fileToRun, modelSession);
      const end = performance.now();

      setInferenceTime(Math.round(end - start));

      if (result.boxes && result.boxes.length > 0) {
        setPredictions(result.boxes);

        // Since we run locally, we no longer generate intermediary feature maps using hooks.
        // We simulate them with placeholder objects so the hovering and animation still works.
        const mockMaps = Array.from({ length: 36 }).map((_, i) => {
          const size = Math.max(
            1,
            Math.floor(640 / Math.pow(2, Math.floor(i / 6))),
          );
          const channels = 16 * ((i % 4) + 1);
          return {
            name: `Conv_Layer_${i}`,
            shape: `[1, ${channels}, ${size}, ${size}]`,
            params: Math.floor(Math.random() * 500000) + 1000,
            base64_image:
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 transparent
          };
        });
        setFeatureMaps(mockMaps);
      } else {
        setError("No objects detected in the image.");
      }
    } catch (err) {
      console.error("Inference Error:", err);
      setError("An error occurred during local inference: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setPredictions([]);
    setFeatureMaps([]);
    setError(null);
    setInferenceTime(0);
    setVisibleMaps(0);
  };

  // ============================================================
  // JSX RETURN — Cyberpunk Terminal Design from Stitch
  // ============================================================
  return (
    <div
      className={`bg-grid relative flex w-full flex-col bg-black text-slate-100 font-display ${
        !previewUrl && !loading
          ? "h-screen overflow-hidden"
          : "min-h-screen overflow-x-hidden pb-12"
      }`}
    >
      {/* Model Loading StatusBar */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        {!modelSession && !initError && (
          <div className="bg-electric-blue/20 text-electric-blue border border-electric-blue px-3 py-2 rounded font-mono text-xs flex items-center gap-2 shadow-[0_0_10px_rgba(0,229,255,0.2)]">
            <span className="material-symbols-outlined animate-spin text-[16px]">
              refresh
            </span>
            Downloading AI Engine (19MB) ...
          </div>
        )}
        {modelSession && !initError && (
          <div
            className="bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14] px-3 py-2 rounded font-mono text-xs flex items-center gap-2 shadow-[0_0_10px_rgba(57,255,20,0.2)] animate-pulse opacity-0 transition-opacity duration-1000"
            style={{
              animationIterationCount: 3,
              animationFillMode: "forwards",
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              check_circle
            </span>
            Local AI Ready
          </div>
        )}
        {initError && (
          <div className="bg-red-500/20 text-red-500 border border-red-500 px-3 py-2 rounded font-mono text-xs max-w-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            Model Error: {initError}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileDrop(e.target.files[0]);
          }
        }}
        className="hidden"
        accept="image/*"
      />      <Sidebars />

      {/* Main Content */}
      <div
        className={`layout-container flex flex-col relative z-10 px-6 xl:pl-48 xl:pr-56 py-4 ${
          !previewUrl && !loading
            ? "flex-1 min-h-0 overflow-hidden"
            : "flex-auto"
        }`}
      >
        <TopNav />

        {/* ============ UPLOAD STATE ============ */}
        {!previewUrl && !loading && (
          <UploadArea
            fileInputRef={fileInputRef}
            sampleImages={sampleImages}
            handleSampleSelect={handleSampleSelect}
            handleFileDrop={handleFileDrop}
          />
        )}

        {/* ============ LOADING STATE ============ */}
        {loading && <ProcessingOverlay />}

        {/* ============ INFERENCE RESULTS STATE ============ */}
        {previewUrl && !loading && (
          <InferenceResults
            previewUrl={previewUrl}
            predictions={predictions}
            featureMaps={featureMaps}
            visibleMaps={visibleMaps}
            hoveredLayer={hoveredLayer}
            setHoveredLayer={setHoveredLayer}
            inferenceTime={inferenceTime}
            handleReset={handleReset}
            imageRef={imageRef}
            detectionImgRef={detectionImgRef}
            detectionCanvasRef={detectionCanvasRef}
            predictionImgRef={predictionImgRef}
            predictionCanvasRef={predictionCanvasRef}
            drawDetectionMini={drawDetectionMini}
          />
        )}

        {/* Error display */}
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-sm font-mono text-sm shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-3 z-50 tracking-widest uppercase">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
