const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  if (!text) return y;
  let line = '';
  const chars = Array.from(text); 
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = chars[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
  return y + lineHeight;
};

const DIAGNOSIS_MAP = {
  "牙结石": 15, "牙龈炎": 20, "疑似扁平苔藓": 30, "疑似龋齿": 25,
  "严重深龋洞": 40, "早期脱矿": 10, "早期脱矿/浅龋": 10,
  "牙齿缺失": 15, "牙菌斑沉积": 5, "健康牙齿": 0
};

Page({
  data: {
    report: null,
    imagePath: '',
    statusText: '分析中',
    statusColor: '#00BFA5',
    patientName: '健康守护者',
    patientGender: '保密',
    recordId: null 
  },

  onLoad: function () {
    const channel = this.getOpenerEventChannel();
    channel.on('acceptData', (data) => {
      if (!data || !data.result) return; 

      let rep = data.result;
      let calcScore = 100;
      let issueCounts = {};

      if (rep && rep.bboxes) {
        rep.bboxes.forEach(b => {
          let tagName = b.label || "";
          let penalty = DIAGNOSIS_MAP[tagName] ?? 10;
          if (tagName && tagName !== "健康牙齿") {
            calcScore -= penalty;
            issueCounts[tagName] = (issueCounts[tagName] || 0) + 1;
          }
          b.tag = tagName;
        });
      }
      calcScore = Math.max(0, calcScore);

      let displayIssues = [];
      let pureNames = [];
      for (let key in issueCounts) {
        displayIssues.push(`${key} (x${issueCounts[key]})`);
        pureNames.push(key);
      }

      let sText = "健康良好";
      let sColor = "#52C41A";
      if (calcScore === 100) { sText = "健康良好"; sColor = "#52C41A"; } 
      else if (calcScore >= 80) { sText = "亚健康"; sColor = "#FAAD14"; } 
      else if (calcScore >= 60) { sText = "需要关注"; sColor = "#FA8C16"; } 
      else { sText = "高风险"; sColor = "#FF4D4F"; }

      let summary = rep.summary || "";
      let needsAI = false;

      if (!data.recordId || !summary.includes('AI护齿管家')) {
        summary = "👨‍⚕️ AI 专家正在为您撰写专属医嘱，请稍候...";
        needsAI = true; 
      }

      rep.health_score = calcScore;
      rep.issues = displayIssues;
      rep.summary = summary;

      let pName = data.patientName;
      let pGender = data.patientGender;

      if (!pName || !pGender || pGender === 'undefined') {
        const cp = wx.getStorageSync('currentPatient');
        const familyProfiles = wx.getStorageSync('familyProfiles') || [];
        const up = wx.getStorageSync('userProfile') || {};

        if (cp && cp.id && cp.id !== 'main') {
          const fam = familyProfiles.find(f => f.id === cp.id) || cp;
          pName = pName || fam.name || cp.name || '家人';
          pGender = pGender || fam.gender || '保密';
        } else {
          pName = pName || up.realName || up.nickName || '本人';
          pGender = pGender || up.gender || '保密';
        }
      }
      if (pGender === pName) { pGender = '保密'; }

      this.setData({
        report: rep,
        imagePath: data.img, 
        statusText: sText,
        statusColor: sColor,
        patientName: pName,
        patientGender: pGender,
        recordId: data.recordId || null
      });

      if (needsAI) {
        this.fetchLLMAdvice(pName, pGender, pureNames, calcScore);
      }
    });
  },

  fetchLLMAdvice(name, gender, issues, score) {
    const issueText = issues.length > 0 ? issues.join('、') : '未发现明显异常';
    const prompt = `你是一位拥有20年临床经验的温柔牙医。患者姓名：${name}，性别：${gender}。视觉AI初步检测发现：${issueText}。健康得分：${score}分（满分100）。请用第一人称（例如“你好，我是你的AI护齿管家”），写一段60字以内、温暖且专业的通俗健康建议。切忌废话，直接给出建议。`;

    const ZHIPU_API_KEY = 'e909be1b34554e84be582efac2a993d6.7xGroEccq1fbjaIz'; 

    wx.request({
      url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      method: 'POST',
      header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZHIPU_API_KEY}` },
      data: { model: "glm-4-flash", messages: [{ role: "user", content: prompt }] },
      success: (res) => {
        if (res.data && res.data.choices && res.data.choices.length > 0) {
          const advice = res.data.choices[0].message.content.trim();
          this.setData({ 'report.summary': advice });

          // 🌟 核心修复点 1：把分数、病症、医嘱打包，一起更新到数据库！
          const updateData = {
            'report.summary': advice,
            'report.health_score': score,             
            'report.issues': this.data.report.issues  
          };

          const db = wx.cloud.database();
          if (this.data.recordId) {
            db.collection('records').doc(this.data.recordId).update({ data: updateData });
          } else {
            db.collection('records').where({ patientName: this.data.patientName })
              .orderBy('createTime', 'desc').limit(1).get().then(resDB => {
                if (resDB.data.length > 0) {
                  db.collection('records').doc(resDB.data[0]._id).update({ data: updateData });
                }
            });
          }
        } else {
          this.setFallbackSummary(score, issueText); 
        }
      },
      fail: () => { this.setFallbackSummary(score, issueText); }
    });
  },

  setFallbackSummary(score, mainIssue) {
      let summary = "您的口腔状况良好，请继续保持！";
      if (score < 100 && score >= 80) summary = `发现初期隐患（如${mainIssue}），建议加强日常清洁并关注。`;
      else if (score < 80 && score >= 60) summary = `存在明显口腔问题（如${mainIssue}），建议尽快预约检查。`;
      else if (score < 60) summary = "检测到严重口腔隐患！请务必立刻就医！";
      
      this.setData({ 'report.summary': summary });

      // 🌟 核心修复点 2：即使 AI 报错断网，也要把正确的分数更新到云端！
      const updateData = {
        'report.summary': summary,
        'report.health_score': score,
        'report.issues': this.data.report.issues
      };
      
      const db = wx.cloud.database();
      if (this.data.recordId) {
        db.collection('records').doc(this.data.recordId).update({ data: updateData });
      } else {
        db.collection('records').where({ patientName: this.data.patientName })
          .orderBy('createTime', 'desc').limit(1).get().then(resDB => {
            if (resDB.data.length > 0) {
              db.collection('records').doc(resDB.data[0]._id).update({ data: updateData });
            }
        });
      }
  },

  saveReportToAlbum() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '图片加载中...', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '正在提取底片...', mask: true });

    const imgPath = this.data.imagePath;

    if (imgPath.startsWith('cloud://')) {
      wx.cloud.downloadFile({
        fileID: imgPath,
        success: res => { this.drawAndSave(res.tempFilePath); },
        fail: err => { wx.hideLoading(); wx.showToast({ title: '云图片下载失败', icon: 'none' }); }
      });
    } else if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      wx.getImageInfo({
        src: imgPath,
        success: res => { this.drawAndSave(res.path); },
        fail: () => { wx.hideLoading(); wx.showToast({ title: '网络图片读取失败', icon: 'none' }); }
      });
    } else {
      this.drawAndSave(imgPath);
    }
  },

  drawAndSave(localImagePath) {
    const { report, imagePath, statusText, statusColor, patientName, patientGender } = this.data;
    const query = wx.createSelectorQuery();
    
    const userName = patientName || '本人';
    const userGender = patientGender || '保密';
    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    query.select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) { wx.hideLoading(); return; }
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const cw = 750;

      const img = canvas.createImage();
      img.src = localImagePath || imagePath;
      
      img.onload = () => {
        const drawW = 650; 
        const drawH = drawW * (img.height / img.width);
        const ch = Math.max(1650, 320 + drawH + 600); 

        canvas.width = cw * dpr; 
        canvas.height = ch * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#F5F7F7'; ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = statusColor; ctx.fillRect(0, 0, cw, 280);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 46px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('AI 口腔影像分析报告', cw / 2, 90);
        ctx.font = '32px sans-serif';
        ctx.fillText(`检测得分: ${report.health_score} 分 | 状态: ${statusText}`, cw / 2, 160);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(40, 180, cw - 80, 70);
        ctx.fillStyle = '#ffffff'; ctx.font = '24px sans-serif';
        ctx.fillText(`受检人: ${userName}  |  性别: ${userGender}  |  检测日期: ${timeStr}`, cw / 2, 225);

        const imgX = 50, imgY = 320;
        ctx.drawImage(img, imgX, imgY, drawW, drawH);

        if (report.bboxes) {
          ctx.lineWidth = 4; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
          report.bboxes.forEach(item => {
            const x = imgX + item.box[0] * drawW;
            const y = imgY + item.box[1] * drawH;
            const w = (item.box[2] - item.box[0]) * drawW;
            const h = (item.box[3] - item.box[1]) * drawH;
            ctx.strokeStyle = '#FF4D4F'; ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = '#FF4D4F'; ctx.fillRect(x, y, ctx.measureText(item.tag).width + 20, 36);
            ctx.fillStyle = '#ffffff'; ctx.fillText(item.tag, x + 10, y + 26);
          });
        }

        const textY = imgY + drawH + 50; 
        ctx.fillStyle = '#ffffff'; ctx.fillRect(40, textY, cw - 80, ch - textY - 80);
        
        let nextY = textY + 70;
        ctx.textAlign = 'left';
        ctx.font = 'bold 30px sans-serif';
        if (report.issues && report.issues.length > 0) {
          ctx.fillStyle = '#FF4D4F';
          nextY = wrapText(ctx, '🚨 检测到问题：' + report.issues.join('、'), 70, nextY, cw - 140, 42);
        } else {
          ctx.fillStyle = '#52C41A';
          nextY = wrapText(ctx, '✅ 状态评估：未见明显口腔病变异常', 70, nextY, cw - 140, 42);
        }

        ctx.fillStyle = '#333333'; ctx.font = 'bold 30px sans-serif';
        ctx.fillText('💡 智能分析建议', 70, nextY + 50);
        ctx.fillStyle = '#666666'; ctx.font = '24px sans-serif';
        wrapText(ctx, report.summary, 70, nextY + 100, cw - 140, 40);

        ctx.fillStyle = '#999999'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚠️ 免责声明：AI 分析仅供参考，不作为临床诊断依据', cw / 2, ch - 50);

        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvas: canvas,
            destWidth: cw,
            destHeight: ch,
            success: (res2) => {
              wx.saveImageToPhotosAlbum({
                filePath: res2.tempFilePath,
                success: () => {
                  wx.hideLoading();
                  wx.showToast({ title: '报告已保存相册', icon: 'success' });
                },
                fail: () => { wx.hideLoading(); }
              });
            }
          });
        }, 500);
      };
    });
  },

  onShareAppMessage() {
    return { title: '我的 AI 口腔分析报告，快来看看！', path: '/pages/index/index' };
  },

  goToChat() {
    const rep = this.data.report;
    const score = rep.health_score || 100;
    const issues = (rep.issues && rep.issues.length > 0) ? rep.issues.join(',') : '无明显异常';
    wx.navigateTo({
      url: `/pages/chat/chat?score=${score}&issues=${issues}`
    });
  }
});