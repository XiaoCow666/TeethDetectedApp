# 使用官方轻量级 Python 镜像，指定3.9-bullseye更稳定（解决部分依赖兼容问题）
FROM python:3.9-slim-bullseye

# 设置工作目录
WORKDIR /app

# 🌟【终极护盾】：安装 Linux 底层图形与窗口基础依赖库（秒杀 libxcb/OpenCV/mediapipe 报错）
# 增加 libgomp1 适配ultralytics/YOLO的多核计算，避免推理时报错
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgl1 libglib2.0-0 libxcb1 libgomp1 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 复制依赖清单（先复制req，利用Docker分层缓存，改代码不重下依赖）
COPY requirements.txt .

# 🌟【极速通道】：安装 Python 依赖库（防超时 + 清华源 + 禁用缓存）
# 移除重复的清华源（req里已有），保留--no-cache-dir减少镜像体积
RUN pip install --no-cache-dir --default-timeout=1000 -r requirements.txt

# 将当前目录下所有文件复制到容器工作目录
COPY . .

# 暴露端口（与启动命令一致，云托管会识别该端口）
EXPOSE 8000

# 🌟【启动加固】：增加--workers 1适配云托管轻量容器，避免端口占用/进程冲突
# 云托管单容器建议单进程，多worker易出问题
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]