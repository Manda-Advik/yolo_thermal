from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
import os
import shutil
from pathlib import Path
import sys
import base64
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from io import BytesIO

# Import custom modules
from custom_yolo import OptimizedResidualBlock, EfficientChannelAttention, SpatialAttention, register_custom_modules

sys.modules['__main__'].OptimizedResidualBlock = OptimizedResidualBlock
sys.modules['__main__'].EfficientChannelAttention = EfficientChannelAttention
sys.modules['__main__'].SpatialAttention = SpatialAttention

if '__mp_main__' not in sys.modules:
    import types
    sys.modules['__mp_main__'] = types.ModuleType('__mp_main__')

sys.modules['__mp_main__'].OptimizedResidualBlock = OptimizedResidualBlock
sys.modules['__mp_main__'].EfficientChannelAttention = EfficientChannelAttention
sys.modules['__mp_main__'].SpatialAttention = SpatialAttention

register_custom_modules()

from ultralytics import YOLO

app = FastAPI(title="YOLO Custom Model API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get the directory where app.py is located
BACKEND_DIR = Path(__file__).resolve().parent
# Project root is one level up
BASE_DIR = BACKEND_DIR.parent

MODEL_PATH = BASE_DIR / "best.pt"
TRAIN_IMAGES_DIR = BASE_DIR / "train" / "images"


# --- HOOK SYSTEM FOR FEATURE MAPS ---
feature_maps = []

def get_activation(idx, cls_name, param_count):
    def hook(model, input, output):
        out_tensor = None
        if isinstance(output, tuple) or isinstance(output, list):
            out_tensor = output[0]
        elif isinstance(output, torch.Tensor):
            out_tensor = output
            
        if not isinstance(out_tensor, torch.Tensor) or out_tensor.dim() < 3:
            return # Skip if it's not a spatial tensor
            
        shape = list(out_tensor.shape)
        feature_maps.append({
            "idx": idx,
            "name": cls_name,
            "params": param_count,
            "shape": shape,
            "tensor": out_tensor.detach().cpu()
        })
    return hook

try:
    print(f"Loading custom YOLO model from {MODEL_PATH}...")
    model = YOLO(str(MODEL_PATH))
    print("Model loaded successfully!")
    
    if hasattr(model, 'model') and hasattr(model.model, 'model'):
        seq = model.model.model
        print("Attaching forward hooks to ALL layers for full pipeline visualization...")
        
        for i, layer in enumerate(seq):
            # Calculate total trainable parameters in this layer
            params = sum(p.numel() for p in layer.parameters() if p.requires_grad)
            layer_class = layer.__class__.__name__
            layer.register_forward_hook(get_activation(i, layer_class, params))
                
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error loading model: {e}")
    model = None

# -------------------------------------


class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    confidence: float
    class_id: int
    class_name: str

class ActivationMap(BaseModel):
    idx: int
    name: str
    params: int
    shape: str
    base64_image: str

class PredictionResponse(BaseModel):
    success: bool
    predictions: List[BoundingBox] = []
    feature_maps: List[ActivationMap] = []
    message: str = ""
    image_width: int = 0
    image_height: int = 0

@app.get("/")
def read_root():
    return {"status": "YOLO Custom Model API is running", "model_loaded": model is not None}

def tensor_to_base64_heatmap(tensor):
    import io
    # Average across channels
    heatmap = torch.mean(tensor[0], dim=0).numpy()
    
    # Normalize to 0-255
    heatmap = heatmap - np.min(heatmap)
    if np.max(heatmap) != 0:
        heatmap = heatmap / np.max(heatmap)
    heatmap = np.uint8(255 * heatmap)
    
    # Resize up slightly if it's very small so the frontend can display it reasonably
    img = Image.fromarray(heatmap)
    img = img.resize((320, 320), Image.NEAREST)
    
    import matplotlib.cm as cm
    colormap = cm.get_cmap('magma') 
    colored_image = colormap(np.array(img)/255.0)
    colored_image = np.uint8(255 * colored_image) 
    
    final_img = Image.fromarray(colored_image[:, :, :3])
    
    buffered = io.BytesIO()
    final_img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return img_str

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    if model is None:
        raise HTTPException(status_code=500, detail="Model failed to load on server startup...")
    
    global feature_maps
    feature_maps.clear() 
    
    temp_file_path = f"temp_{file.filename}"
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Inference
        results = model(temp_file_path)
        
        predictions = []
        result = results[0]
        img_height, img_width = result.orig_shape
        
        for box in result.boxes:
            coords = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = result.names[cls_id]
            
            predictions.append(BoundingBox(
                x_min=coords[0],
                y_min=coords[1],
                x_max=coords[2],
                y_max=coords[3],
                confidence=conf,
                class_id=cls_id,
                class_name=cls_name
            ))
            
        # Process the captured feature maps
        extracted_maps = []
        for fmap_data in feature_maps:
            try:
                 b64 = tensor_to_base64_heatmap(fmap_data["tensor"])
                 extracted_maps.append(ActivationMap(
                     idx=fmap_data["idx"],
                     name=fmap_data["name"],
                     params=fmap_data["params"],
                     shape=str(fmap_data["shape"]),
                     base64_image=b64
                 ))
            except Exception as layer_err:
                 print(f"Failed to process heatmap for Layer {fmap_data['idx']}: {layer_err}")
            
        return PredictionResponse(
            success=True,
            predictions=predictions,
            feature_maps=extracted_maps,
            image_width=img_width,
            image_height=img_height,
            message="Inference successful"
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return PredictionResponse(success=False, message=str(e))
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.get("/train_images/{filename}")
async def get_train_image(filename: str):
    file_path = TRAIN_IMAGES_DIR / filename
    if file_path.exists() and file_path.is_file():
        return FileResponse(
            file_path, 
            headers={"Access-Control-Allow-Origin": "*"}
        )
    raise HTTPException(status_code=404, detail="Image not found")

@app.get("/api/train_images")
async def list_train_images(limit: int = 10):
    if not TRAIN_IMAGES_DIR.exists():
        return {"images": [], "error": "Train images directory not found"}
    
    try:
        images = []
        for file in os.listdir(TRAIN_IMAGES_DIR):
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                # Derive a human-readable label from the filename
                stem = Path(file).stem  # e.g. "person_crossing_01"
                label = stem.replace("_", " ").replace("-", " ").title()
                # Truncate long labels
                label = label if len(label) <= 20 else label[:18] + "…"
                images.append({"filename": file, "label": label})
                if len(images) >= limit:
                    break
        return {"images": images}
    except Exception as e:
        return {"error": str(e), "images": []}


@app.get("/api/dataset/download")
async def download_dataset():
    """Zip the entire training images folder and return it for download."""
    if not TRAIN_IMAGES_DIR.exists():
        raise HTTPException(status_code=404, detail="Dataset directory not found")
    
    import io
    import zipfile
    from fastapi.responses import StreamingResponse
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for img_file in TRAIN_IMAGES_DIR.iterdir():
            if img_file.is_file() and img_file.suffix.lower() in (".png", ".jpg", ".jpeg"):
                zf.write(img_file, arcname=img_file.name)
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=yolo_dataset.zip"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
