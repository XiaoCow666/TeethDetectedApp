# Oral AI Health Screening (MVP)

> **从0到1、可落地、可交付的口腔 AI 筛查解决方案**。
> 基于 YOLOv8-seg 与 规则引擎，实现"拍照 -> 识别 -> 报告"全流程。

## 📁 目录结构

```
oral-ai-mvp/
├── data/               # [工具] 数据采集与增强
│   ├── collect_data.py # 爬虫脚本 (Bing/Google)
│   └── augment.py      # 增强脚本 (模拟手机拍摄)
├── docs/               # [文档] 开发规范
│   └── label_guidelines.md # 标注规范 (LabelStudio)
├── models/             # [算法] 模型训练
│   ├── train.py        # 训练脚本 (YOLOv8-seg)
│   └── export.py       # 导出脚本 (ONNX)
├── api/                # [后端] 推理服务
│   ├── main.py         # FastAPI 入口
│   └── core/engine.py  # 规则引擎 (AI->人话)
├── frontend/           # [前端] 设计图
│   └── design_spec.md  # 小程序开发逻辑
├── Dockerfile          # 部署脚本
└── docker-compose.yml  # 一键启动配置
```

## 🚀 快速开始 (Quick Start)

### 1. 数据准备 (Data Pipeline)
```bash
# 1. 下载数据 (例如龋齿图片)
python data/collect_data.py --keyword "dental caries intraoral" --num 500 --clean

# 2. 标注数据
# 使用 LabelStudio 按照 docs/label_guidelines.md 进行标注，导出为 YOLO 格式。

# 3. 数据增强 (扩充数据量 5倍)
python data/augment.py --input ./raw_data --output ./train_data --multiplier 5
```

### 2. 模型训练 (Training)
```bash
# 训练 YOLOv8-seg 模型
python models/train.py --data data/oral.yaml --epochs 100

# 导出为 ONNX (用于生产环境)
python models/export.py --weights runs/segment/train/weights/best.pt
```

### 3. 启动服务 (Backend)

**开发模式**:
```bash
pip install -r requirements.txt
uvicorn api.main:app --reload
```
API 文档地址: `http://localhost:8000/docs`

**生产部署 (Docker)**:
```bash
# 确保已经把 best.pt 放入 models/ 目录
docker-compose up -d --build
```
服务将在 `8000` 端口启动。

## 🛠️ 技术栈
*   **AI**: YOLOv8-segmentation (Ultralytics)
*   **后端**: FastAPI, OpenCV, Uvicorn
*   **部署**: Docker, ONNX Runtime
*   **协作**: GitFlow Lite

## 📝 核心规则 (Rule Engine)
本系统**不提供医疗诊断**。所有 AI 结果通过 `api/core/engine.py` 转化为风险提示：
*   `class_2 (medium caries)` -> **中风险 (Medium Risk)**: 建议近期就医。
*   `class_5 (heavy calculus)` -> **需洁牙 (Cleaning Needed)**: 建议洗牙。

## ⚠️ 免责声明
本工具仅供口腔健康初筛，**不能替代专业医生的临床诊断**。
