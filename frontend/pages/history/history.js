const db = wx.cloud.database({ env: 'cloud1-4gjcsw2vb1218641' });
const _ = db.command;

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
    records: [], 
    selectedIds: [], 
    isSelectAll: false,
    patientId: 'main',
    currentName: '本人',
    currentGender: '保密'
  },

  onLoad(options) {
    const familyProfiles = wx.getStorageSync('familyProfiles') || [];
    const up = wx.getStorageSync('userProfile') || {};

    if (options && options.familyId) {
      const fam = familyProfiles.find(f => f.id === options.familyId) || {};
      this.setData({
        patientId: options.familyId,
        currentName: options.name || fam.name || '家人',
        currentGender: fam.gender || '保密'
      });
    } else {
      const currentPatient = wx.getStorageSync('currentPatient');
      if (currentPatient && currentPatient.id && currentPatient.id !== 'main') {
        const fam = familyProfiles.find(f => f.id === currentPatient.id) || currentPatient;
        this.setData({
          patientId: currentPatient.id,
          currentName: fam.name || currentPatient.name || '家人',
          currentGender: fam.gender || '保密'
        });
      } else {
        this.setData({
          patientId: 'main',
          currentName: up.realName || up.nickName || '本人',
          currentGender: up.gender || '保密'
        });
      }
    }
  },

  onShow() { this.loadRecords(); },

  loadRecords() {
    wx.showLoading({ title: '同步档案...' });

    let queryCondition = { patientId: this.data.patientId };
    if (this.data.patientId === 'main') {
      queryCondition = _.or([ { patientId: 'main' }, { patientId: _.exists(false) } ]);
    }

    db.collection('records').where(queryCondition).orderBy('createTime', 'desc').get({
      success: res => {
        const records = res.data.map(r => {
          if(r.report && r.report.bboxes){
            r.report.bboxes.forEach(b => b.tag = b.label || b.class || b.name || '异常');
          }
          if(r.createTime) {
             const d = new Date(r.createTime);
             r.displayTime = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          } else {
             r.displayTime = '最近检测';
          }
          return { ...r, checked: false };
        });
        this.setData({ records, selectedIds: [], isSelectAll: false });
        wx.hideLoading();
      }
    });
  },

  onCheckboxChange(e) {
    const selectedIds = e.detail.value;
    const records = this.data.records.map(r => ({ ...r, checked: selectedIds.indexOf(r._id) !== -1 }));
    this.setData({ selectedIds, records, isSelectAll: selectedIds.length === records.length && records.length > 0 });
  },

  toggleSelectAll() {
    const isSelectAll = !this.data.isSelectAll;
    const selectedIds = isSelectAll ? this.data.records.map(r => r._id) : [];
    const records = this.data.records.map(r => ({ ...r, checked: isSelectAll }));
    this.setData({ isSelectAll, selectedIds, records });
  },

  deleteBatch() {
    if (this.data.selectedIds.length === 0) return;
    wx.showModal({
      title: '确认删除', content: '确定删除选中记录？',
      success: sm => {
        if (sm.confirm) {
          db.collection('records').where({ _id: _.in(this.data.selectedIds) }).remove({ success: () => { this.loadRecords(); }});
        }
      }
    });
  },

  async downloadBatch() {
    if (this.data.selectedIds.length === 0) return;
    wx.authorize({
      scope: 'scope.writePhotosAlbum',
      success: () => { this.startBatchDrawing(); },
      fail: () => { wx.showModal({ title: '需要相册权限', content: '请允许保存' }); }
    });
  },

  startBatchDrawing() {
    wx.showLoading({ title: '海报生成中...', mask: true });

    const query = wx.createSelectorQuery();
    query.select('#historyCanvas').fields({ node: true, size: true }).exec(async (res) => {
      if (!res[0]) { wx.hideLoading(); wx.showToast({ title: '请检查画布', icon: 'none' }); return; }
      
      const canvas = res[0].node, ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      const cw = 750;

      for (let i = 0; i < this.data.selectedIds.length; i++) {
        const id = this.data.selectedIds[i];
        const record = this.data.records.find(r => r._id === id);

        try {
          const fileRes = await wx.cloud.downloadFile({ fileID: record.imageFileID });
          await this.drawSinglePoster(canvas, ctx, cw, dpr, record, fileRes.tempFilePath, 
            record.patientName || this.data.currentName, 
            record.patientGender || this.data.currentGender,
            i + 1, this.data.selectedIds.length
          );
        } catch (e) { console.error('单张失败', e); }
      }
      
      wx.hideLoading(); wx.showToast({ title: '批量保存成功！', icon: 'success' });
      this.setData({ selectedIds: [], isSelectAll: false, records: this.data.records.map(r => ({ ...r, checked: false })) });
    });
  },

  fetchLLMAdviceSync(name, gender, issues, score) {
    return new Promise((resolve) => {
      const issueText = issues.length > 0 ? issues.join('、') : '未发现明显异常';
      const prompt = `你是一位拥有20年临床经验的温柔牙医。患者姓名：${name}，性别：${gender}。视觉AI初步检测发现：${issueText}。健康得分：${score}分（满分100）。请用第一人称（例如“你好，我是你的AI护齿管家”），写一段60字以内、温暖且专业的通俗健康建议。切忌废话，直接给出建议。`;
      
      // 🔑 注意：填入你的智谱 API KEY
      const ZHIPU_API_KEY = 'e909be1b34554e84be582efac2a993d6.7xGroEccq1fbjaIz'; 

      wx.request({
        url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        method: 'POST',
        header: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ZHIPU_API_KEY}` },
        data: { model: "glm-4-flash", messages: [{ role: "user", content: prompt }] },
        success: (res) => {
          if (res.data && res.data.choices && res.data.choices.length > 0) {
            resolve(res.data.choices[0].message.content.trim());
          } else { resolve(null); }
        },
        fail: () => { resolve(null); }
      });
    });
  },

  drawSinglePoster(canvas, ctx, cw, dpr, record, localImagePath, userName, userGender, currentIndex, totalCount) {
    return new Promise(async (resolve, reject) => {
      let rep = record.report || {};
      let calcScore = 100;
      let issueCounts = {};

      if (rep && rep.bboxes) {
        rep.bboxes.forEach(b => {
          let tagName = b.label || b.tag || b.class || b.name || "异常";
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
      let mainIssue = pureNames[0];
      
      // 🌟 核心拦截逻辑：只有没有“AI护齿管家”印记的历史数据，才会被重新抓取生成！
      let summary = rep.summary || ""; 
      let needsAI = false;

      if (!summary.includes('AI护齿管家')) {
        needsAI = true; 
        if (calcScore === 100) { summary = "您的口腔状况良好，请继续保持！"; } 
        else if (calcScore >= 80) { summary = mainIssue ? `发现初期口腔隐患（如${mainIssue}），建议加强日常清洁并关注。` : "发现初期问题，建议加强清洁。"; } 
        else if (calcScore >= 60) { summary = mainIssue ? `存在明显的口腔问题（如${mainIssue}），建议尽快预约检查。` : "存在明显隐患，建议尽快就医。"; } 
        else { summary = "检测到严重口腔隐患！请务必立刻就医！"; }
      }

      if (calcScore === 100) { sText = "健康良好"; sColor = "#52C41A"; } 
      else if (calcScore >= 80) { sText = "亚健康"; sColor = "#FAAD14"; } 
      else if (calcScore >= 60) { sText = "需要关注"; sColor = "#FA8C16"; } 
      else { sText = "高风险"; sColor = "#FF4D4F"; }

      if (needsAI) {
        wx.showLoading({ title: `AI撰写中 ${currentIndex}/${totalCount}`, mask: true });
        try {
          const aiAdvice = await this.fetchLLMAdviceSync(userName, userGender, pureNames, calcScore);
          if (aiAdvice) {
            summary = aiAdvice;
            db.collection('records').doc(record._id).update({ data: { 'report.summary': aiAdvice } });
            record.report.summary = aiAdvice; 
          }
        } catch(e) { console.error("大模型请求失败", e); }
      } else {
        wx.showLoading({ title: `极速渲染中 ${currentIndex}/${totalCount}`, mask: true });
      }

      const timeStr = record.displayTime;
      const img = canvas.createImage();
      img.src = localImagePath;
      img.onload = () => {
        const drawW = 650; const drawH = drawW * (img.height / img.width);
        const dynamicCh = Math.max(1650, 320 + drawH + 600); 

        canvas.width = cw * dpr; canvas.height = dynamicCh * dpr;
        ctx.scale(dpr, dpr);

        ctx.fillStyle = '#F5F7F7'; ctx.fillRect(0, 0, cw, dynamicCh);
        ctx.fillStyle = sColor; ctx.fillRect(0, 0, cw, 280);

        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 46px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('AI 口腔影像分析报告', cw / 2, 90);
        ctx.font = '32px sans-serif'; ctx.fillText(`检测得分: ${calcScore} 分 | 状态: ${sText}`, cw / 2, 160);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(40, 180, cw - 80, 70);
        ctx.fillStyle = '#ffffff'; ctx.font = '24px sans-serif';
        ctx.fillText(`受检人: ${userName}  |  性别: ${userGender}  |  时间: ${timeStr}`, cw / 2, 225);

        const imgX = 50, imgY = 320;
        ctx.drawImage(img, imgX, imgY, drawW, drawH);

        if (rep.bboxes) {
          ctx.lineWidth = 4; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'left';
          rep.bboxes.forEach(item => {
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
        ctx.fillStyle = '#ffffff'; ctx.fillRect(40, textY, cw - 80, dynamicCh - textY - 80);
        
        let nextY = textY + 70;
        ctx.textAlign = 'left';
        ctx.font = 'bold 30px sans-serif';
        if (displayIssues.length > 0) {
          ctx.fillStyle = '#FF4D4F';
          nextY = wrapText(ctx, '🚨 检测到问题：' + displayIssues.join('、'), 70, nextY, cw - 140, 42);
        } else {
          ctx.fillStyle = '#52C41A';
          nextY = wrapText(ctx, '✅ 状态评估：未见明显口腔病变异常', 70, nextY, cw - 140, 42);
        }

        ctx.fillStyle = '#333333'; ctx.font = 'bold 30px sans-serif';
        ctx.fillText('💡 智能分析建议', 70, nextY + 50);
        ctx.fillStyle = '#666666'; ctx.font = '24px sans-serif';
        wrapText(ctx, summary, 70, nextY + 100, cw - 140, 40);

        ctx.fillStyle = '#999999'; ctx.font = '22px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⚠️ 免责声明：AI 分析仅供参考，不作为临床诊断依据', cw / 2, dynamicCh - 50);

        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvas: canvas, destWidth: cw, destHeight: dynamicCh,
            success(res) {
              wx.saveImageToPhotosAlbum({ 
                filePath: res.tempFilePath, 
                success: () => resolve(), 
                fail: reject 
              });
            }, fail: reject
          });
        }, 500);
      };
      img.onerror = reject;
    });
  },

  goToReport(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: '/pages/report/report',
      success: (res) => {
        res.eventChannel.emit('acceptData', { 
          result: item.report,        
          img: item.imageFileID,
          patientName: item.patientName || this.data.currentName,
          patientGender: item.patientGender || this.data.currentGender,
          recordId: item._id 
        });
      }
    });
  },

  deleteSingle(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除', content: '确定要删除这条检测记录吗？',
      success: sm => {
        if (sm.confirm) {
          db.collection('records').doc(id).remove({ 
            success: () => { wx.showToast({ title: '已删除', icon: 'success' }); this.loadRecords(); }
          });
        }
      }
    });
  },

  downloadSingle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedIds: [id] }, () => { this.downloadBatch(); });
  }
});