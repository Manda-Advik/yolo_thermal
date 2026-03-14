import sys
from pathlib import Path
from ultralytics import YOLO

# Import custom modules needed to load the model
from custom_yolo import OptimizedResidualBlock, EfficientChannelAttention, SpatialAttention, register_custom_modules

# Ensure custom modules are available exactly as they were when saving
sys.modules['__main__'].OptimizedResidualBlock = OptimizedResidualBlock
sys.modules['__main__'].EfficientChannelAttention = EfficientChannelAttention
sys.modules['__main__'].SpatialAttention = SpatialAttention

register_custom_modules()

def export_to_onnx():
    model_path = Path(__file__).parent.parent / "best.pt"
    
    if not model_path.exists():
        print(f"Error: Model not found at {model_path}")
        return

    print(f"Loading model from {model_path}...")
    model = YOLO(model_path)
    
    print("Exporting model to ONNX format...")
    # opset=12 is widely supported by onnxruntime-web
    success = model.export(format="onnx", opset=12, simplify=True)
    
    print(f"Export finished. Result: {success}")

if __name__ == "__main__":
    export_to_onnx()
