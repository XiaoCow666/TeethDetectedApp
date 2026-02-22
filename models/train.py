from ultralytics import YOLO
import argparse
import os

def train_model(data_yaml, epochs=100, img_size=640, device='cpu'):
    """
    训练 YOLOv8-seg 分割模型。
    
    Args:
        data_yaml (str): 数据集配置文件路径 (oral.yaml)
        epochs (int): 训练轮数
        img_size (int): 输入图片尺寸
        device (str): 训练设备 ('cpu', '0', '0,1' etc.)
    """
    print(f"🚀 开始训练 YOLOv8-seg... (Device: {device})")
    
    # 1. 加载预训练模型 (使用 segment 版本)
    # nano 版本最快，适合手机端；small 版本精度稍好
    model = YOLO('yolov8n-seg.pt') 
    
    # 2. 开始训练
    results = model.train(
        data=data_yaml,
        epochs=epochs,
        imgsz=img_size,
        device=device,
        patience=20,        # Early stopping
        batch=8,           # 根据显存调整
        workers=2,
        save=True,          # 保存 checkpoints
        project='oral_ai_project',
        name='yolov8n_seg_v1',
        exist_ok=True,
        pretrained=True,
        optimizer='AdamW',  # 适合小数据集
        lr0=0.001,          # 初始学习率
    )
    
    print(f"✅ 训练完成。最佳模型保存在: {results.save_dir}/weights/best.pt")
    return results.save_dir

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=str, default="data/oral.yaml", help="Path to data.yaml")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--device", type=str, default="cpu", help="cuda device, i.e. 0 or 0,1,2,3 or cpu")
    
    args = parser.parse_args()
    
    # 检查 yaml 是否存在
    if not os.path.exists(args.data):
        print(f"⚠️ 警告: 找不到数据集配置文件 {args.data}。请先准备数据。")
        # 创建一个示例 yaml 模板
        with open(args.data, 'w', encoding='utf-8') as f:
            f.write(
"""path: ../datasets/oral_v1  # 数据集根目录
train: images/train
val: images/val
test: images/test

# 类别名称 (与 docs/label_guidelines.md 一致)
names:
  0: tooth
  1: caries_shallow
  2: caries_medium
  3: caries_deep
  4: calculus_mild
  5: calculus_heavy
  6: gingivitis_red
  7: gingivitis_swollen
""")
        print(f"📄 已生成示例配置文件: {args.data}")
    
    train_model(args.data, args.epochs, device=args.device)
