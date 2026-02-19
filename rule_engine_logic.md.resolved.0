# Rule Engine Logic: From AI/YOLO to Health Report

This engine translates raw AI detections (Bounding Boxes, Probability Class, Size) into a **Structured Health Report**.

## 1. Input Data (From YOLOv8-seg)
```json
[
  { "class_id": 0, "label": "tooth", "conf": 0.95, "bbox": [...] },
  { "class_id": 1, "label": "calculus", "conf": 0.82, "bbox": [...] }, // Tartar
  { "class_id": 2, "label": "caries_deep", "conf": 0.75, "bbox": [...] }, // Cavity
  { "class_id": 3, "label": "gingivitis_red", "conf": 0.65, "bbox": [...] } // Gum Redness
]
```

## 2. Scoring Logic (0-100 Scale)
**Base Score**: 100
**Deductions**:
*   **Decay (Caries)**:
    *   `caries_shallow`: -5 points (per instance)
    *   `caries_medium`: -10 points
    *   `caries_deep`: -20 points (Max deduction 40)
*   **Tartar (Calculus)**:
    *   `calculus_mild`: -3 points
    *   `calculus_heavy`: -8 points
*   **Gum Health (Gingivitis)**:
    *   `gingivitis_red`: -5 points
    *   `gingivitis_swollen`: -10 points

**Formula**: `Final_Score = MAX(0, 100 - SUM(Deductions))`

## 3. Report Generation Rules

| Detection | Severity | User-Facing Text (Risk) | Professional Advice (Action) |
| :--- | :--- | :--- | :--- |
| **Caries (Deep)** | High | 🔴 **High Risk**: Potential structural damage detected on [Tooth Location]. | **Immediate Action**: Schedule a dentist visit for restoration assessment. Avoid hard foods on this side. |
| **Caries (Shallow)** | Low | 🟡 **Medium Risk**: Surface discoloration observed. | **Monitor**: Enhance brushing. Use fluoride toothpaste. Re-scan in 3 months. |
| **Calculus (Heavy)** | Med | 🟠 **Moderate Risk**: Hardened plaque accumulation. | **Clean**: Professional scaling (cleaning) is recommended. Brushing cannot remove this. |
| **Gingivitis** | Low | 🟡 **Warning**: Gum redness/swelling detected. | **Care**: Floss daily. Ensure you are not brushing too hard. |
| **None** | - | 🟢 **Healthy**: No visible issues detected. | **Maintain**: Keep up the good work! Routine checkup every 6 months. |

## 4. Disclaimer Injection
**ALWAYS** append to specific high-risk outputs:
> *"This is a screening result based on visual analysis, NOT a medical diagnosis. Only a dentist can confirm cavities via X-ray/Probe."*
