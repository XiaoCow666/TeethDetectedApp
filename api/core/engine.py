from typing import List, Dict, Any

class RuleEngine:
    """
    口腔健康规则引擎
    将 AI 检测结果转换为结构化健康报告
    """
    
    # 扣分规则 (基于 rule_engine_logic.md)
    DEDUCTIONS = {
        "caries_shallow": 5,
        "caries_medium": 10,
        "caries_deep": 20,
        "calculus_mild": 3,
        "calculus_heavy": 8,
        "gingivitis_red": 5,
        "gingivitis_swollen": 10
    }

    # 建议文案库
    ADVICE_DB = {
        "caries_deep": {
            "title": "高风险 (High Risk)",
            "action": "请立即就医。检测到可能的深龋，建议拍摄X光片确认是否需要根管治疗。",
            "severity": "high"
        },
        "caries_medium": {
            "title": "中风险 (Medium Risk)",
            "action": "建议近期就医。发现明显牙体缺损，可能需要补牙。",
            "severity": "medium"
        },
        "caries_shallow": {
            "title": "低风险 (Low Risk)",
            "action": "建议观察。注意口腔清洁，使用含氟牙膏，每3个月复查。",
            "severity": "low"
        },
        "calculus_heavy": {
            "title": "需洁牙 (Cleaning Needed)",
            "action": "建议洗牙。日常刷牙无法去除此类沉积物，建议进行专业洁治。",
            "severity": "medium"
        },
        "calculus_mild": {
            "title": "注意清洁 (Hygiene Alert)",
            "action": "改进刷牙方式。建议使用巴氏刷牙法，配合牙线。",
            "severity": "low"
        },
        "gingivitis_swollen": {
            "title": "牙龈警报 (Gum Alert)",
            "action": "牙龈明显肿胀。请检查刷牙力度是否过大，是否有食物嵌塞。",
            "severity": "medium"
        },
        "gingivitis_red": {
            "title": "牙龈关注 (Gum Care)",
            "action": "牙龈轻微发红。请坚持使用牙线，并在刷牙时轻柔按摩牙龈。",
            "severity": "low"
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
            
            # 深龋和重度牙结石如果出现多次，扣分会有上限，防止负分
            # MVP版本简化逻辑：直接累减，最低0分
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
            if label == 'tooth': continue # 牙齿本身不是问题
            
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
            "summary": "您的口腔状况良好，请继续保持。" if score > 90 else "发现一些潜在问题，建议查看详细建议。",
            "disclaimer": "本报告基于AI视觉筛查，仅供参考，不能替代医生临床诊断。如遇具体不适，请务必前往医院就诊。"
        }
