# 🦷 龋齿检测数据集获取指南 (Data Guide)

为了保证代码仓库的轻量化和拉取速度，本项目 GitHub 仓库不包含几百 MB 的原始图片数据。请团队成员按照以下步骤手动获取并在本地配置数据：

## 1. 数据来源
我们使用的是 Kaggle 上的高质量开源龋齿数据集：
🔗 [Dental Cavities Synthesized Multi-Source Dataset](https://www.kaggle.com/datasets/shahjahanabdullatif/datasetcavitydetection)

## 2. 下载与本地配置步骤
1. 点击上方链接，登录 Kaggle 账号并点击页面右上角的 **Download** 下载完整压缩包。
2. 解压下载好的 `.zip` 文件。
3. 进入解压后的 `Dental_Cavity_Dataset` 目录，你只需要用到里面的 **`test`** 文件夹（它包含了纯净的 `Cavity` 有龋齿 和 `Non_Cavity` 无龋齿 分类图片）。那个巨大的 `train` 文件夹可以直接删除。
4. 将筛选好的图片，复制并统一放到我们项目的 `raw_data/` 目录下。

> ⚠️ **安全提醒：** > 本项目的 `.gitignore` 已经配置好了拦截规则。存放在 `raw_data/` 和 `train_data/` 目录下的所有图片，都不会被 Git 追踪，绝不会被意外推送到 GitHub，请大家放心存放你的几千张数据！