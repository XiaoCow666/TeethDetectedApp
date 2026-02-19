# GitHub Collaboration Guide: Oral AI Team

## 1. Branching Strategy (GitFlow Lite)
We use a simplified GitFlow significantly adapted for AI/Data projects.

*   `main`: **Production Ready**. Deployable code ONLY. Protected branch (PR required).
*   `dev`: **Integration**. All features merge here first. Deployed to Staging.
*   `feat/MVP-X`: Frontend/Backend feature logic.
*   `model/vX`: **Model Training Experiments**.
    *   *Rule*: `model` branches are for *training code* and *config*, NOT large model weights.
    *   *Weights Logic*: Store weights (`.pt`, `.onnx`) in cloud storage (S3/OSS) or use DVC (Data Version Control). **NEVER commit >100MB files to GitHub**.

## 2. Commit Convention (Conventional Commits)
Format: `<type>(<scope>): <subject>`

*   **feat**: New feature (e.g., `feat(ui): add camera overlay`)
*   **fix**: Bug fix (e.g., `fix(api): handle timeout on large images`)
*   **data**: Dataset/Annotation changes (e.g., `data: update label map for caries`)
*   **model**: Model architecture/training changes (e.g., `model(yolo): change backbone to efficientnet`)
*   **docs**: Documentation only
*   **chore**: Maintenance (ci, build, deps)

## 3. Workflow Example

### Scenario: Adding "Gingivitis Detection"

1.  **Algorithm Engineer**:
    *   Create branch `model/gingivitis-v1`.
    *   Train model, export `gingivitis_v1.onnx`.
    *   Upload ONNX to shared cloud bucket.
    *   Commit training scripts to GitHub.
    *   PR -> `dev`.

2.  **Backend Engineer**:
    *   Create branch `feat/gingivitis-api`.
    *   Pull `dev` to get training scripts (if needed) or just download ONNX from cloud.
    *   Update `inference.py` to load new ONNX.
    *   Update `rule_engine.py` to handle "Gingivitis" class.
    *   Test locally.
    *   PR -> `dev`.

3.  **Frontend Engineer**:
    *   Wait for Backend API update on Staging.
    *   Create `feat/gingivitis-ui`.
    *   Add "Gum Health" section to Report Page.
    *   PR -> `dev`.

## 4. Pull Request (PR) Rules
*   **Title**: Must follow Commit Convention.
*   **Description**:
    *   What does this do?
    *   How to test? (Screenshots for UI, cURL for API).
*   **Reviewers**: At least 1 approval required.
