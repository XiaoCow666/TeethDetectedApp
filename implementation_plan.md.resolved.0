# Implementation Plan: AI Oral Health Screening MVP

## Goal Description
Build a **WeChat Mini-program** for oral health screening that uses **AI (YOLOv8-seg)** to analyze intraoral photos (taken by user/phone) and generates a structured, non-diagnostic risk report.

## User Review Required
> [!IMPORTANT]
> **Data Strategy Shift**: Public X-ray datasets are useless for this. We will rely on customized data collection and available RGB intraoral datasets.
> **Deployment Cost**: GPU server is recommended for training, but CPU inference (ONNX) is targeted for deployment to save costs (~$10-20/mo vs $100+).

## Proposed Changes

### 1. Data Pipeline (Crucial)
#### [NEW] `data/`
*   `collect_data.py`: Script to scrape/organize RGB images.
*   `augment.py`: Albumentations script to simulate "bad lighting", "blur", "rotation" (essential for phone photos).
*   `label_guidelines.md`: Strict guide for LabelStudio (e.g., "Label the *visible* crown only").

### 2. AI Engine (Python/PyTorch)
#### [NEW] `models/`
*   `train.py`: YOLOv8-seg training script.
*   `export.py`: PT -> ONNX conversion with quantization (Float32 -> Int8 if possible) for speed.
*   `inference.py`: Core logic wrapping the ONNX runner.

### 3. Backend (FastAPI)
#### [NEW] `api/`
*   `main.py`: Endpoints (`/upload`, `/health`).
*   `core/engine.py`: **Rule Engine**. Maps AI detection class IDs to human-readable strings.
    *   *Logic*: If `class_id=2 (Calculus)` detected with `conf>0.6` -> Add "Cleaning Advice" to Report.
*   `utils/image.py`: Pre-processing (CLAHE enhancement, white balance) to normalize different phone cameras.

### 4. Frontend (WeChat Mini-program)
#### [NEW] `frontend/`
*   `pages/camera/`: Custom camera page with **SVG Overlays** (Wireframe of teeth) to guide user positioning.
*   `pages/report/`: Canvas-based drawing of the "Dental Map" (visualizing which tooth has issues).

## Verification Plan

### Automated Tests
*   **Backend**: `pytest` for API endpoints (mocking the AI model).
*   **Rule Engine**: Unit tests for logic (e.g., "Input: 3 cavities -> Output: High Risk Score").

### Manual Verification
*   **The "Mirror Test"**:
    1.  Stand in front of a mirror.
    2.  Use the Mini-program to take a photo of own teeth.
    3.  Verify:
        *   Does the overlay help alignment?
        *   Does the AI detect obvious features (lips, teeth)?
        *   Is the report generated in < 2 seconds?
