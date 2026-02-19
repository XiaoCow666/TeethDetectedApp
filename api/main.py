from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import uvicorn
import os
import time

from api.utils.image import read_image_file, visualize_results
from api.core.engine import RuleEngine

app = FastAPI(
    title="Oral AI Screening API",
    description="专业口腔健康筛查 AI 服务 (MVP)",
    version="0.1.0"
)

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局加载模型 (Lazy loading or Pre-loading)
MODEL_PATH = "weights/best.pt" # 训练好后放在这里
model = None

# ID 到 Label 的映射 (必须与 oral.yaml 一致)
CLASS_NAMES = {
    0: "tooth",
    1: "caries_shallow",
    2: "caries_medium",
    3: "caries_deep",
    4: "calculus_mild",
    5: "calculus_heavy",
    6: "gingivitis_red",
    7: "gingivitis_swollen"
}

@app.on_event("startup")
async def load_model():
    global model
    # 如果没有模型文件，我们可以加载一个官方提供的 nano 模型先跑通流程
    target_path = MODEL_PATH if os.path.exists(MODEL_PATH) else "yolov8n-seg.pt"
    print(f"🔄 Loading AI Model from {target_path}...")
    try:
        model = YOLO(target_path)
        print("✅ Model loaded successfully.")
    except Exception as e:
        print(f"❌ Failed to load model: {e}")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Oral AI API"}

@app.post("/predict")
async def predict_oral_health(file: UploadFile = File(...)):
    """
    核心接口：上传图片 -> AI推理 -> 规则引擎 -> 返回报告
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    start_time = time.time()
    
    # 1. 读取图片
    try:
        image_bytes = await file.read()
        image = read_image_file(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {e}")
        
    # 2. AI 推理
    # conf=0.25 是默认阈值，可以根据需求调整
    results = model.predict(image, conf=0.25)
    result = results[0] #这一帧的结果
    
    # 3. 解析结果
    detections = []
    
    if result.boxes:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            bbox = box.xyxy[0].tolist() # [x1, y1, x2, y2]
            
            label = CLASS_NAMES.get(cls_id, "unknown")
            
            detections.append({
                "label": label,
                "conf": conf,
                "bbox": bbox,
                # 如果有分割掩码，也可以在这里添加 "mask": ...
            })
            
    # 4. 规则引擎生成报告
    report = RuleEngine.generate_report(detections)
    
    # 5. 添加性能指标
    process_time = (time.time() - start_time) * 1000
    report['meta'] = {
        "inference_ms": round(process_time, 2),
        "model_version": "v1.0-mvp"
    }
    
    return report

if __name__ == "__main__":
    # 开发模式启动
    uvicorn.run(app, host="0.0.0.0", port=8000)
