import io
import time
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from ultralytics import YOLO

app = FastAPI(title="Oral AI Diagnosis API", version="3.0-BBox")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载模型
MODEL_PATH = "best.pt"
try:
    model = YOLO(MODEL_PATH)
    print(f"✅ 成功加载 9 分类模型: {MODEL_PATH}")
except Exception as e:
    print(f"❌ 模型加载失败: {e}")


class RuleEngine:
    DIAGNOSIS_RULES = {
        "CALCULUS": {"title": "牙结石", "severity": "medium", "penalty": 5, "action": "建议预约洗牙（超声波洁治）。"},
        "Gingivitis": {"title": "牙龈炎", "severity": "medium", "penalty": 10,
                       "action": "请注意口腔卫生，掌握巴氏刷牙法。"},
        "Lichen": {"title": "疑似扁平苔藓", "severity": "high", "penalty": 15,
                   "action": "强烈建议尽快前往口腔黏膜科排查。"},
        "caries": {"title": "疑似龋齿", "severity": "high", "penalty": 15, "action": "建议尽快就医修补，防止龋洞加深。"},
        "decaycavity": {"title": "严重深龋洞", "severity": "high", "penalty": 20,
                        "action": "请立刻前往医院评估是否需要根管治疗。"},
        "earlydecay": {"title": "早期脱矿/浅龋", "severity": "low", "penalty": 2,
                       "action": "建议使用含氟牙膏，定期观察复查。"},
        "healthytooth": {"title": "健康牙齿", "severity": "info", "penalty": 0, "action": "牙齿状况良好，请继续保持！"},
        "missing": {"title": "牙齿缺失", "severity": "medium", "penalty": 10,
                    "action": "建议咨询医生进行种植牙或义齿修复。"},
        "plaque": {"title": "牙菌斑沉积", "severity": "low", "penalty": 2, "action": "建议增加刷牙时长，并使用冲牙器。"}
    }

    @classmethod
    def analyze(cls, predictions):
        score = 100
        issues_dict = {}

        for label in predictions:
            rule = cls.DIAGNOSIS_RULES.get(label)
            if not rule or label == "healthytooth":
                continue

            score -= rule["penalty"]
            score = max(0, score)

            if label in issues_dict:
                issues_dict[label]["count"] += 1
            else:
                issues_dict[label] = {
                    "type": label,
                    "title": rule["title"],
                    "severity": rule["severity"],
                    "action": rule["action"],
                    "count": 1
                }

        issues_list = list(issues_dict.values())
        if score >= 90:
            summary = "您的口腔状况良好，未见明显异常。"
        elif score >= 70:
            summary = "发现初期口腔问题，建议近期多加关注。"
        else:
            summary = "发现较多口腔病变痕迹，强烈建议尽快预约牙医！"

        return {"health_score": score, "summary": summary, "issues": issues_list}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    start_time = time.time()
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    results = model(image)

    predictions = []
    bboxes = []  # 存储红框坐标

    for r in results:
        if r.boxes:
            for box in r.boxes:
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                predictions.append(class_name)

                # 提取归一化坐标并过滤健康牙齿
                if class_name != "healthytooth":
                    xyxyn = box.xyxyn[0].tolist()
                    cn_title = RuleEngine.DIAGNOSIS_RULES.get(class_name, {}).get("title", class_name)
                    bboxes.append({"label": cn_title, "box": xyxyn})

    report = RuleEngine.analyze(predictions)
    report["bboxes"] = bboxes  # 将坐标打包进报告
    report["meta"] = {"inference_ms": round((time.time() - start_time) * 1000, 2)}

    return report