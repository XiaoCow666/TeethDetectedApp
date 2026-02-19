# Feasibility Analysis & Risk Report: AI Oral Health Screening MVP

## 1. Executive Summary
**Feasibility Score**: 8.5/10
**Verdict**: **High technical viability**, but **Data Acquisition** is the critical bottleneck. The proposed "X-ray datasets" will **NOT** work for an "Intraoral Photo" product.

## 2. Critical Risks & Solutions

### 🚨 Risk 1: Data Source Mismatch (CRITICAL)
*   **Issue**: You plan to build a product based on **Phone/Intraoral Photos** (RGB images), but the datasets you listed (UIUC, Osti, Tufts) are primarily **X-ray/Radiography** (Grayscale/DICOM).
*   **Consequence**: A model trained on X-rays will have **0% accuracy** on phone photos. They are fundamentally different modalities.
*   **Correction**: You MUST acquire **Intraoral RGB Images**.
    *   *Verified Sources*:
        *   **Kaggle**: "Teeth Separation", "Dental Caries" datasets (variable quality, usually small ~50-200 images).
        *   **Google Image Scraper** (Filtered): For "Cavities", "Tartar" (High noise, requires massive cleaning).
        *   **Self-Collection (The ONLY scalable path)**: Your "Volunteers" and "Partner Clinics" plan is not just an option, it is a **NECESSITY**.
*   **Action**: Shift data strategy weight: 80% Self-Collection/Partnership, 20% Public Internet Data.

### ⚠️ Risk 2: "Standard 6-Angle" Compliance
*   **Issue**: Users (non-professionals) struggle to take standard medical-grade photos (angles specific to intraoral mirrors).
*   **Impact**: Model receives garbage data → Garbage output.
*   **Solution**:
    *   **Frontend Guide**: Real-time mask overlay on camera (AR guide) to force alignment *before* capture.
    *   **Quality Check AI**: A lightweight "Pre-check" model that rejects blurry/bad-angle photos immediately.

### ⚖️ Risk 3: Medical Compliance (The "Diagnosis" Trap)
*   **Issue**: Using words like "Gingivitis" (Medical Term) alongside a "Red/Green" risk indicator can be interpreted as diagnosis.
*   **Solution**:
    *   **Terminology Shift**:
        *   Gingivitis → "Gum Health Risk" / "Redness Level"
        *   Caries → "Surface Integrity" / "Dark Spot Classification"
    *   **Disclaimer**: Must appear on the *loading screen* and *report footer*.

## 3. Technical Architecture Refinements

### Model Optimization
*   **Original**: YOLOv8 (Detect) + U-Net (Segment) + MobileNet (Classify).
*   **Refinement**: **YOLOv8-seg (Segmentation)**.
    *   *Why*: YOLOv8-seg can do Detection (where is the tooth) AND Segmentation (exact shape) in **ONE pass**.
    *   *Benefit*: Reduces inference time by ~40%, simplifies deployment.
    *   *Pipeline*: Input → YOLOv8-seg → Bounding Box Crops → Rules Engine → Report.

### Backend Strategy
*   **Protocol**: FastAPI is perfect.
*   **Security**: Images must be processed in memory or temp storage and **deleted** immediately after inference unless user explicitly consents to "Donation for Research". Storing medical user data requires HIPAA/GDPR level compliance (expensive for MVP). **Stateless** is safest for MVP.

## 4. Modified Project Timeline (21 Days)
*   **Day 1-7**: Data Collection & Cleaning (The hardest part).
*   **Day 8-14**: Model Training (YOLOv8-seg) & Rule Engine Logic.
*   **Day 15-18**: Mini-program Dev (AR Camera + Report UI).
*   **Day 19-21**: Integration & Field Testing.
