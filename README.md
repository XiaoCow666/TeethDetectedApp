# SmileGuard 护齿管家

口腔AI智能筛查系统

微信小程序 + FastAPI 后端 + YOLO 检测，拍照即可做口腔问题初筛。

## 重要须知

### 当前状态

- 代码完整：前端、后端、训练脚本、数据集目录都已在仓库中
- 当前可运行：基于现有 `best.pt` 和 `data.yaml` 可以直接启动后端并联通前端
- 当前模型能力：以龋齿/牙齿 2 类检测为主，其他口腔类别的页面与规则已预留，后续可继续扩展训练

### 你需要关注的配置

- 小程序配置：`frontend/project.config.json`
- 小程序入口：`frontend/app.js`
- 后端入口：`api/main.py`
- 依赖文件：`requirements.txt`
- Docker 部署：`Dockerfile`
- 模型权重：`best.pt`

### 免责声明

本工具仅供口腔健康初筛参考，不能替代专业牙科医生的临床诊断。

## 关于本项目

SmileGuard 护齿管家是一款面向普通用户的居家口腔健康 AI 初筛工具，以微信小程序为载体。用户只需拍摄一张牙齿照片，系统即可自动识别潜在口腔问题，生成健康分数、风险提示和护理建议，并支持历史记录追踪。

本仓库已经包含：

- 微信小程序前端
- FastAPI 推理服务
- YOLO 训练与导出脚本
- 训练、验证、测试数据目录
- 已训练好的模型文件 `best.pt`

## 核心功能

- 拍照即检：拍摄或上传口腔照片，自动发起识别
- 当前 2 类识别：当前数据配置为 `Caries` 与 `Tooth`
- 健康评分：根据识别结果生成分数与摘要
- 报告展示：支持检测框、问题列表、建议文本
- 历史记录：支持查看历史检测记录
- 家庭档案：支持本人和家人模式切换
- 刷牙管理：内置刷牙计时器和统计页
- 扩展能力：已预留论坛、视频流、AI 问答等页面

## 技术栈

| 层级 | 技术 | 说明 |
| --- | --- | --- |
| 前端 | 微信小程序（原生） | 轻量交互，适合移动端快速拍照 |
| 后端 | FastAPI + Python | 提供图片上传与推理接口 |
| AI 模型 | YOLO / Ultralytics | 当前用于牙齿与龋齿检测 |
| 图像处理 | Pillow / OpenCV | 图片读取与基础处理 |
| 部署 | Docker | 支持容器化部署 |
| 数据 | 本地数据集 + 微信云开发 | 本地训练，云端存历史记录 |

## 项目结构

```text
SmileGuard/
├── README.md
├── .gitignore
├── data.yaml
├── best.pt
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── api/
│   └── main.py                  # FastAPI 后端入口
├── data/
│   ├── collect_data.py          # 数据采集脚本
│   └── augment.py               # 数据增强脚本
├── models/
│   ├── train.py                 # 模型训练
│   └── export.py                # 模型导出
├── train/                       # 训练集
├── valid/                       # 验证集
├── test/                        # 测试集
├── frontend/
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── project.config.json
│   ├── design_spec.md
│   └── pages/
│       ├── index/               # 首页
│       ├── camera/              # 拍照页
│       ├── report/              # 报告页
│       ├── history/             # 历史记录
│       ├── mine/                # 个人中心
│       ├── timer/               # 刷牙计时器
│       ├── brushStats/          # 刷牙统计
│       ├── forum/               # 社区页
│       ├── videoList/           # 科普视频
│       └── chat/                # AI 问答
└── docs/
    └── label_guidelines.md      # 标注说明
```

## 当前可用能力

### 当前版本

当前 `data.yaml` 配置如下：

- 类别数：2
- 类别名：`Caries`、`Tooth`
- 数据目录：`train/images`、`valid/images`、`test/images`

### 后续扩展方向

仓库内的前端页面和后端规则已经预留了更多口腔问题扩展空间，例如：

- 牙菌斑
- 牙结石
- 牙龈炎
- 缺牙
- 早期龋坏

但这些能力是否真正可用，仍取决于后续数据集整理、标注与再训练结果。

## 运行步骤

### Step 1: 安装依赖

```bash
pip install -r requirements.txt
```

### Step 2: 启动后端

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

可访问：

- 健康检查：`http://127.0.0.1:8000/`
- API 文档：`http://127.0.0.1:8000/docs`

### Step 3: 打开微信小程序

使用微信开发者工具打开 `frontend/` 目录。

你需要检查：

- `frontend/project.config.json` 中的小程序配置
- `frontend/app.js` 中的云开发环境配置
- `frontend/pages/camera/camera.js` 中的后端接口地址

## 数据准备

当前仓库已经带有训练、验证、测试目录，可以直接基于现有数据运行和训练。

### 当前数据

- 训练集目录：`train/`
- 验证集目录：`valid/`
- 测试集目录：`test/`
- 配置文件：`data.yaml`

### 数据增强

如需继续处理数据，可使用：

```bash
python data/augment.py
```

### 获取更多类别数据

如果你想把项目从 2 类扩展为更多口腔问题，推荐自行收集并整理更多数据，再统一类别名后重新训练。

建议扩展类别：

- Tooth
- Caries
- Missing_Tooth
- Plaque
- Calculus
- Gingivitis
- Enamel_Wear

## 模型训练

### 训练

```bash
python models/train.py --data data.yaml --epochs 100 --device cpu
```

### 导出

```bash
python models/export.py --weights best.pt --format onnx
```

## 系统流程

```text
用户拍照 / 选图
  │
  ▼
前端裁剪口腔区域
  │
  ▼
上传到 FastAPI /predict
  │
  ▼
YOLO 加载 best.pt 做检测
  │
  ▼
规则引擎生成 health_score / issues / summary
  │
  ▼
前端展示报告、保存历史记录
```

## API 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/` | 健康检查 |
| POST | `/predict` | 上传图片并返回检测报告 |

当前返回结果包含：

- `health_score`
- `summary`
- `issues`
- `bboxes`
- `meta`
- `has_teeth`

## 适用场景

- 家庭日常口腔健康自检
- 家长关注孩子牙齿状态
- 居家口腔健康管理
- 口腔健康科普与习惯养成
- 诊所演示或初步筛查辅助

## 局限性

- 当前模型主要基于 2 类数据，能力有限
- 检测效果依赖拍照角度、清晰度和光线
- 早期微小病变识别能力有限
- 不能替代医生面诊和临床检查

## Docker 部署

```bash
docker-compose up -d --build
```

当前仓库根目录已提供：

- `Dockerfile`
- `docker-compose.yml`

## License

MIT
