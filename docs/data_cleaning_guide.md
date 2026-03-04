# 数据清洗与标注实战指南 (Data Cleaning & Labeling)

一份高质量的数据集比任何高级算法都重要。请严格按照本指南操作。

## 第一步：数据清洗 (Cleaning)

在开始标注前，必须先剔除“垃圾数据”。打开 `datasets/raw` 文件夹，按以下标准执行：

### ❌ 必须删除 (DELETE)
1.  **X光片/全景片** (黑白骨骼图)：我们的产品是处理手机照片的，X光片会严重干扰模型。
2.  **卡通/示意图**：任何手绘、3D建模、医学插图。
3.  **非口内照**：医生头像、诊所广告、牙刷特写等。
4.  **极度模糊**：肉眼无法分辨牙齿边缘的图片。
5.  **严重遮挡**：被金属器械（张口器除外）、棉球遮挡超过 50% 的牙齿。

### ✅ 必须保留 (KEEP)
1.  **真实口内照**：手机或口腔内窥镜拍摄的 RGB 彩色照片。
2.  **有瑕疵的照片**：轻微手抖、光线稍暗的照片（这些是很好的“负样本”，能提升模型鲁棒性）。
3.  **不同角度**：正畸视角、咬合面、侧面视角。

---

## 第二步：标注工具配置 (Label Studio)

虽然有很多工具，但我们推荐 **Label Studio**，因为它支持团队协作且界面友好。

### 1. 安装与启动
```bash
# 建议在新的虚拟环境中安装
pip install label-studio
label-studio start
```
启动后，浏览器会自动打开 `http://localhost:8080` (注册一个本地账号即可)。

### 2. 创建项目
1.  点击 **Create Project** -> 输入 Project Name (e.g., "Oral-v1")。
2.  **Data Import**: 直接拖入清洗后的图片文件夹，或者上传清洗后的图片。
3.  **Labeling Setup**: 选择 **Computer Vision** -> **Object Detection with Bounding Boxes**。
4.  **关键步骤**：删除默认标签，将以下 XML 配置复制进去（直接覆盖）：

```xml
<View>
  <Image name="image" value="$image"/>
  <!-- 保留原有标签和颜色，仅修改标注形状类型 -->
  <PolygonLabels name="label" toName="image">
    <Label value="tooth" background="blue"/>
    <Label value="caries_shallow" background="#FFD700"/>
    <Label value="caries_medium" background="#FFA500"/>
    <Label value="caries_deep" background="red"/>
    <Label value="calculus_mild" background="#90EE90"/>
    <Label value="calculus_heavy" background="green"/>
    <Label value="gingivitis_red" background="pink"/>
    <Label value="gingivitis_swollen" background="purple"/>
  </PolygonLabels>
  <!-- 新增画笔工具，用于蛀牙/牙龈炎等像素级精细标注 -->
  <BrushLabels name="brush_label" toName="image" strokeWidth="3">
    <Label value="tooth" background="blue"/>
    <Label value="caries_shallow" background="#FFD700"/>
    <Label value="caries_medium" background="#FFA500"/>
    <Label value="caries_deep" background="red"/>
    <Label value="calculus_mild" background="#90EE90"/>
    <Label value="calculus_heavy" background="green"/>
    <Label value="gingivitis_red" background="pink"/>
    <Label value="gingivitis_swollen" background="purple"/>
  </BrushLabels>
</View>
```
*注意：这个配置确保了导出的类别 ID 与我们代码中的 `oral.yaml` 严格一致。*

---

## 第三步：标注实操 (Annotation)

### 1. 快捷键
*   数字键 `1-8`: 快速切换标签类别。
*   `Ctrl + 滚轮`: 缩放图片。
*   `右键拖动`: 移动画布。

### 2. 标注流程
1.  先选 `tooth` (牙齿)，把所有**完整可见**的牙齿框出来。
2.  再选病灶 (如 `caries_medium`)，框出具体的蛀牙位置。
    *   *技巧*：病灶框通常在牙齿框的**内部**。
3.  **边缘处理**：框尽量紧贴边缘，不要留太多空隙。

---

## 第四步：导出数据 (Export)

标注完成后：
1.  点击右上角 **Export**。
2.  选择格式：**YOLO**。
3.  下载压缩包。
4.  解压后，将 `labels` 文件夹里的 `.txt` 文件和对应的图片，按 `train/val` 比例放入 `data/oral_v1` 目录中。

---

### ❓ 常见问题 (FAQ)

**Q: 一张图里有好多牙，都要标吗？**
A: 是的。即使是健康的牙齿也要标 `tooth`，否则模型会认为“不标的都是背景”，导致漏检。

**Q: 牙龈只有一点点红，标不标？**
A: 如果您作为普通人觉得“看起来不健康”，就标 `gingivitis_red`。如果非常轻微，可以不标。

**Q: 倒影和口水反光怎么办？**
A: 忽略它们，凭借经验框出牙齿的真实轮廓。
