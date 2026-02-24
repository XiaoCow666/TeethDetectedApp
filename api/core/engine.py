from typing import List, Dict, Any


class RuleEngine:
    """
    口腔健康规则引擎
    将 AI 检测结果转换为结构化健康报告 (适配 V1 2分类模型)
    """

    # 扣分规则 (目前只有 Caries 一种问题)
    DEDUCTIONS = {
        "Caries": 20  # 每发现一处龋齿，扣除20分
    }

    # 建议文案库
    ADVICE_DB = {
        "Caries": {
            "title": "发现疑似龋齿 (蛀牙)",
            "action": "AI 识别到牙齿表面存在龋坏迹象。建议尽快前往口腔科进行详细检查和修补，防止龋洞加深引发牙髓炎。",
            "severity": "high"
        }
    }

    @staticmethod
    def calculate_score(detections: List[Dict[str, Any]]) -> int:
        """
        根据检测结果计算健康分 (0-100)
        """
        current_score = 100
        for det in detections:
            label = det.get('label')
            score_deduction = RuleEngine.DEDUCTIONS.get(label, 0)

            # 累减分数，最低 0 分
            current_score -= score_deduction

        return max(0, current_score)

    @staticmethod
    def generate_report(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        生成完整报告
        """
        score = RuleEngine.calculate_score(detections)
        issues = []

        # 聚合相同的问题
        grouped_issues = {}
        for det in detections:
            label = det.get('label')

            # 【修复Bug】忽略正常牙齿 (兼容大小写)
            if label.lower() == 'tooth':
                continue

            if label not in grouped_issues:
                grouped_issues[label] = 0
            grouped_issues[label] += 1

        for label, count in grouped_issues.items():
            advice = RuleEngine.ADVICE_DB.get(label, {
                "title": "未知问题", "action": "请咨询医生", "severity": "low"
            })

            issues.append({
                "type": label,
                "count": count,
                "title": advice['title'],
                "action": advice['action'],
                "severity": advice['severity']
            })

        return {
            "health_score": score,
            "issues": issues,
            # 根据最终分数动态返回总结话术
            "summary": "您的口腔状况良好，请继续保持正常的刷牙习惯。" if score == 100 else "发现疑似口腔问题，强烈建议您尽快预约牙医进行专业检查。",
            "disclaimer": "本报告基于AI视觉筛查，仅供参考，不能替代医生临床诊断。如遇具体不适，请务必前往医院就诊。"
        }