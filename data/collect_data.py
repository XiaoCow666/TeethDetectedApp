import os
import argparse
import hashlib
from PIL import Image
# Requires: icrawler
try:
    from icrawler.builtin import BingImageCrawler, GoogleImageCrawler
except ImportError:
    print("Please install icrawler: pip install icrawler")
    exit(1)

def calculate_hash(image_path):
    """Calculate MD5 hash of image to remove duplicates."""
    hash_md5 = hashlib.md5()
    with open(image_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()

def clean_data(data_dir):
    """Remove corrupted images and duplicates."""
    print(f"🧹 Cleaning data in {data_dir}...")
    seen_hashes = set()
    removed_count = 0
    
    for root, _, files in os.walk(data_dir):
        for file in files:
            file_path = os.path.join(root, file)
            try:
                # 1. Check if image is valid
                with Image.open(file_path) as img:
                    img.verify() 
                
                # 2. Check for duplicates
                img_hash = calculate_hash(file_path)
                if img_hash in seen_hashes:
                    print(f"Duplicate found: {file_path}")
                    os.remove(file_path)
                    removed_count += 1
                else:
                    seen_hashes.add(img_hash)
                    
            except (IOError, SyntaxError) as e:
                # Corrupt file
                print(f"Corrupt file removed: {file_path} ({e})")
                os.remove(file_path)
                removed_count += 1
                
    print(f"✅ Cleanup complete. Removed {removed_count} bad/duplicate files.")

def collect_images(keyword, max_num, out_dir, clean=False):
    save_dir = os.path.join(out_dir, keyword.replace(" ", "_"))
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    print(f"🚀 Starting download: '{keyword}' ({max_num} images)...")
    
    # Try Bing first (usually easier w/o API keys)
    bing_crawler = BingImageCrawler(storage={'root_dir': save_dir})
    bing_crawler.crawl(keyword=keyword, max_num=max_num)
    
    print("✅ Download finished.")
    
    if clean:
        clean_data(save_dir)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Oral AI Data Collector")
    parser.add_argument("--keyword", type=str, required=True, help="Search keyword (e.g., 'dental caries intraoral')")
    parser.add_argument("--num", type=int, default=100, help="Number of images to download")
    parser.add_argument("--out", type=str, default="raw_data", help="Output root directory")
    parser.add_argument("--clean", action="store_true", help="Run cleanup after download")
    
    args = parser.parse_args()
    
    collect_images(args.keyword, args.num, args.out, args.clean)
