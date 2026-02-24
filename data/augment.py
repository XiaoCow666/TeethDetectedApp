import albumentations as A
import cv2
import os
import glob
import random
from tqdm import tqdm

def get_augmentation_pipeline():
    """
    Define the augmentation pipeline to simulate real-world phone photo conditions.
    """
    return A.Compose([
        # 1. Geometric Transformations (Hand shake, weird angles)
        A.Rotate(limit=25, p=0.7),
        A.HorizontalFlip(p=0.5), # Mirror selfie vs rear camera
        A.RandomScale(scale_limit=0.2, p=0.5),
        
        # 2. Lighting & Color (Bad bathroom lighting, flash)
        A.RandomBrightnessContrast(p=0.5),
        A.HueSaturationValue(p=0.3),
        A.CLAHE(p=0.3), # Local contrast enhancement
        
        # 3. Quality Degradation (Blur, ISO noise, Compression)
        A.GaussianBlur(blur_limit=(3, 7), p=0.3),
        A.ISONoise(p=0.3),
        #A.ImageCompression(quality_lower=60, quality_upper=100, p=0.3),原代码
        #2.19Jiang修改
        A.ImageCompression(quality_range=(60, 100), p=0.3),
        
        # 4. Crop (User zooms in/out)
        A.RandomCrop(width=450, height=450, p=0.1), # Assuming resize later
    ])

def augment_dataset(input_dir, output_dir, multiplier=3):
    """
    Augment images in input_dir and save to output_dir.
    multiplier: How many augmented versions to create per image.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    image_paths = glob.glob(os.path.join(input_dir, "*.*"))
    valid_exts = ['.jpg', '.jpeg', '.png', '.bmp']
    image_paths = [p for p in image_paths if os.path.splitext(p)[1].lower() in valid_exts]
    
    pipeline = get_augmentation_pipeline()
    
    print(f"🔄 Augmenting {len(image_paths)} images with {multiplier}x variants...")
    
    for img_path in tqdm(image_paths):
        image = cv2.imread(img_path)
        if image is None:
            continue
        
        # Save original
        base_name = os.path.basename(img_path)
        name, ext = os.path.splitext(base_name)
        
        # Generate augmented versions
        for i in range(multiplier):
            try:
                augmented = pipeline(image=image)['image']
                save_name = f"{name}_aug_{i}{ext}"
                cv2.imwrite(os.path.join(output_dir, save_name), augmented)
            except Exception as e:
                print(f"Error augmenting {img_path}: {e}")

    print(f"✅ Augmentation complete. Images saved to {output_dir}")

# Usage:
# python augment.py --input ./raw_data/caries --output ./processed_data/train/caries --multiplier 5
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--multiplier", type=int, default=3)
    args = parser.parse_args()
    
    augment_dataset(args.input, args.output, args.multiplier)
