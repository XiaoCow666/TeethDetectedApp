from ultralytics import YOLO
import argparse
import os

def export_model(weights_path, format='onnx'):
    """
    将训练好的 PyTorch 模型导出为 ONNX 格式，以便后端轻量化部署。
    """
    print(f"📦 正在导出模型: {weights_path} -> {format}...")
    
    if not os.path.exists(weights_path):
        print(f"❌ 错误: 找不到模型文件 {weights_path}")
        return

    model = YOLO(weights_path)
    
    # 导出
    # opset=12 兼容性较好
    # simplify=True 使用 onnx-simplifier 优化图结构
    success = model.export(format=format, opset=12, simplify=True)
    
    if success:
        print(f"✅ 导出成功: {success}")
    else:
        print("❌ 导出失败")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", type=str, required=True, help="Path to best.pt")
    parser.add_argument("--format", type=str, default="onnx", help="Export format (onnx, ncnn, openvino)")
    
    args = parser.parse_args()
    
    export_model(args.weights, args.format)
