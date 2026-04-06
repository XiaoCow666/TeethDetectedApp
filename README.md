# TeethDetectedApp

一个基于 YOLO 的口腔影像检测项目，仓库里同时包含：

- 微信小程序前端
- FastAPI 推理后端
- 训练与导出脚本
- 训练、验证、测试数据
- 已训练好的模型权重 `best.pt`

当前项目的主链路是：

1. 用户在小程序拍照或从相册选择口腔图片
2. 小程序裁剪口腔区域后上传到后端 `/predict`
3. 后端加载 `best.pt` 并返回检测框、标签、健康分数和摘要
4. 小程序生成报告页，并把记录写入微信云开发数据库

## 当前目录

```text
TeethDetectedApp/
|-- api/                     # FastAPI 后端
|   |-- main.py              # 当前实际使用的后端入口
|-- frontend/                # 微信小程序
|   |-- app.js
|   |-- app.json
|   |-- pages/
|   |   |-- index/           # 首页
|   |   |-- camera/          # 拍照与上传
|   |   |-- report/          # 报告页
|   |   |-- history/         # 历史记录
|   |   |-- mine/            # 个人/家庭档案
|   |   |-- timer/           # 刷牙计时器
|   |   |-- brushStats/      # 刷牙统计
|   |   |-- forum/           # 社区页
|   |   |-- videoList/       # 科普视频流
|   |   |-- chat/            # AI 问答
|-- models/                  # 训练与导出脚本
|   |-- train.py
|   |-- export.py
|-- data/                    # 数据采集/增强脚本
|-- train/                   # 训练集
|-- valid/                   # 验证集
|-- test/                    # 测试集
|-- data.yaml                # 当前数据集配置
|-- best.pt                  # 当前推理使用的模型权重
|-- requirements.txt
|-- Dockerfile
|-- docker-compose.yml
```

## 后端说明

当前后端核心逻辑集中在 `api/main.py`：

- `GET /`：健康检查
- `POST /predict`：接收图片并返回识别结果
- 首次请求时懒加载 `best.pt`
- 返回字段包含：
  - `health_score`
  - `summary`
  - `issues`
  - `bboxes`
  - `meta.inference_ms`
  - `has_teeth`

## 前端说明

微信小程序入口配置在 `frontend/app.json`。

当前页面列表：

- `pages/index/index`：首页
- `pages/camera/camera`：拍照与上传
- `pages/report/report`：检测报告
- `pages/mine/mine`：个人中心
- `pages/history/history`：历史记录
- `pages/timer/timer`：刷牙计时器
- `pages/forum/forum`：社区
- `pages/videoList/videoList`：视频列表
- `pages/brushStats/brushStats`：刷牙统计
- `pages/chat/chat`：AI 问答

## 本地启动

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动后端

```bash
uvicorn api.main:app --reload
```

启动后可访问：

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/docs`

### 3. 小程序

使用微信开发者工具打开 `frontend/`。

注意：

- 小程序依赖微信云开发环境
- 前端里已经写了云环境 ID 和线上推理地址
- 如果切换环境，需要同步修改 `frontend/app.js` 与相关页面配置

## 模型训练

### 训练

```bash
python models/train.py --data data.yaml --epochs 100 --device cpu
```

### 导出

```bash
python models/export.py --weights best.pt --format onnx
```

## 数据集说明

当前 `data.yaml` 指向：

- `train/images`
- `valid/images`
- `test/images`

当前类别数为 2：

- `Caries`
- `Tooth`

仓库里也保留了更大范围的项目设想和扩展页面，但实际模型配置仍以当前 `data.yaml` 和 `best.pt` 为准。

## Docker

```bash
docker-compose up -d --build
```

当前 `Dockerfile` 使用 `python:3.9-slim-bullseye`，并通过 `uvicorn` 暴露 `8000` 端口。

## 免责声明

本项目用于口腔健康初筛与演示，不能替代专业医生诊断。
