import cv2
import numpy as np
from PIL import Image
import io

def read_image_file(file_bytes: bytes) -> np.ndarray:
    """
    读取上传的字节流为 OpenCV 图像 (BGR)
    """
    image = Image.open(io.BytesIO(file_bytes))
    
    # 转换 RGB -> BGR (OpenCV 默认)
    image_np = np.array(image)
    if image.mode == 'RGB':
        image_np = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
    elif image.mode == 'RGBA':
        image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2BGR)
        
    return image_np

def preprocess_image(image: np.ndarray, target_size=640) -> np.ndarray:
    """
    预处理管道：
    1. 缩放
    2. 增强 (CLAHE) - 可选，MVP先不做复杂增强，保持原图真实性
    """
    # 保持长宽比缩放
    h, w = image.shape[:2]
    scale = target_size / max(h, w)
    new_w, new_h = int(w * scale), int(h * scale)
    
    resized = cv2.resize(image, (new_w, new_h))
    
    # Pad to square (YOLO requirement mostly handled by letterbox inside ultralytics, 
    # but good to be explicit if we use raw ONNX)
    # 这里我们如果直接用 Ultralytics 的 predict() 接口，它会自动处理 padding
    
    return resized

def visualize_results(image: np.ndarray, detections: list) -> np.ndarray:
    """
    在图上画框 (用于调试/生成预览图)
    """
    vis_img = image.copy()
    for det in detections:
        bbox = det['bbox'] # [x1, y1, x2, y2]
        label = det['label']
        conf = det['conf']
        
        # 颜色映射 (与 label_guidelines 保持一致)
        color = (0, 255, 0) # Default Green
        if 'caries' in label: color = (0, 0, 255) # Red
        if 'calculus' in label: color = (0, 255, 255) # Yellow
        
        x1, y1, x2, y2 = map(int, bbox)
        cv2.rectangle(vis_img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(vis_img, f"{label} {conf:.2f}", (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
                   
    return vis_img
