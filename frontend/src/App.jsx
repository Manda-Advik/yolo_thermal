import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import "./index.css";
import { Sidebars } from "./components/Sidebars";
import { TopNav } from "./components/TopNav";
import { UploadArea } from "./components/UploadArea";
import { ProcessingOverlay } from "./components/ProcessingOverlay";
import { InferenceResults } from "./components/InferenceResults";
import { API_URL } from "./config";

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

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const detectionCanvasRef = useRef(null);
  const detectionImgRef = useRef(null);
  const predictionCanvasRef = useRef(null);
  const predictionImgRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    fetchSampleImages();
  }, []);

  const fetchSampleImages = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/train_images?limit=4`);
      if (response.data.images) {
        setSampleImages(response.data.images);
      }
    } catch (err) {
      console.error("Could not fetch training images:", err);
    }
  };

  const drawBoxesForCanvas = (canvasRef, imgRef, textFormatter = null) => {
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

    const BOX_COLORS = ["#39FF14", "#00FFFF", "#00E5FF", "#FFBF00", "#FF00FF"];

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
        : `${pred.class_name} ${(pred.confidence * 100).toFixed(0)}%`;

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
  };

  const drawBoxes = useCallback(() => {
    drawBoxesForCanvas(
      canvasRef,
      imageRef,
      (p) => `${p.class_name} ${(p.confidence * 100).toFixed(2)}`,
    );
  }, [predictions, previewUrl]);

  const drawDetectionMini = useCallback(() => {
    drawBoxesForCanvas(detectionCanvasRef, detectionImgRef);
    drawBoxesForCanvas(predictionCanvasRef, predictionImgRef);
  }, [predictions, previewUrl]);

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

  const handleImageUpload = (event) => {
    handleFileDrop(event.target.files[0]);
  };

  const handleSampleSelect = async (filename) => {
    try {
      const url = `${API_URL}/train_images/${filename}`;
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
    setLoading(true);
    setError(null);
    setPredictions([]);
    setFeatureMaps([]);
    const start = performance.now();
    const formData = new FormData();
    formData.append("file", fileToRun);
    try {
      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const end = performance.now();
      setInferenceTime(Math.round(end - start));
      if (response.data.success) {
        setPredictions(response.data.predictions);
        setFeatureMaps(response.data.feature_maps || []);
        if (response.data.predictions.length === 0) {
          setError("No objects detected in the image.");
        }
      } else {
        setError(response.data.message || "Failed to process image");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("An error occurred during prediction.");
      }
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      <Sidebars />

      {/* Main Content */}
      <div className={`layout-container flex flex-col relative z-10 px-6 xl:pl-48 xl:pr-56 py-4 ${
        !previewUrl && !loading
          ? "flex-1 min-h-0 overflow-hidden"
          : "flex-auto"
      }`}>
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
