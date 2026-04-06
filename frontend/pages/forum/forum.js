const db = wx.cloud.database({ env: 'cloud1-4gjcsw2vb1218641' });
const _ = db.command;

// 引入真实动态时间计算引擎
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '刚刚';
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return '刚刚'; 
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'; 
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'; 
  if (diff < 2592000000) return Math.floor(diff / 86400000) + '天前'; 
  
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const now = Date.now();
const seedPosts = [
  {
    author_id: 'system_admin',
    display_id: '1024',
    content: '最近吃冰的东西牙齿酸痛，是不是蛀牙了呀？有点害怕看牙医...',
    comments: 3,
    likes: 12,
    timestamp: now - 86400000, 
    commentList: [
      { name: '匿名牙友_332', text: '深有同感！千万别拖，我拖了一年最后根管治疗了😭', timestamp: now - 3600000, time: '1小时前', likes: 25, isLiked: false, isMine: false, replyTo: null },
      { name: '匿名牙友_887', text: '去医院拍个片子几十块钱就搞定了。', timestamp: now - 1800000, time: '半小时前', likes: 8, isLiked: false, isMine: false, replyTo: null },
      { name: '匿名牙友_007', text: '真的假的？拍片子这么便宜吗？', timestamp: now - 600000, time: '10分钟前', likes: 2, isLiked: false, isMine: false, replyTo: '匿名牙友_887' }
    ]
  },
  {
    author_id: 'system_admin',
    display_id: '886',
    content: '坚持用小程序里的“巴氏刷牙计时器”打卡第 10 天，感觉牙龈出血真的变少了！推荐大家试试！',
    comments: 1,
    likes: 45,
    timestamp: now - 172800000, 
    commentList: [
      { name: '匿名牙友_991', text: '同款打卡！原来我以前每次刷牙都不到一分钟，难怪牙结石那么多。', timestamp: now - 86400000, time: '1天前', likes: 12, isLiked: false, isMine: false, replyTo: null }
    ]
  }
];

Page({
  data: {
    posts: [],
    showCommentPanel: false,
    currentPostIndex: -1,
    commentInput: '',
    inputFocus: false,
    replyTarget: null, 
    showPostModal: false,
    postInput: '',
    myOpenId: '',
    keyboardHeight: 0 
  },

  onLoad() {
    wx.cloud.callFunction({
      name: 'getOpenId',
      success: res => {
        this.setData({ myOpenId: res.result.openid });
        this.initForum();
      },
      fail: () => {
        this.initForum();
      }
    });
  },

  onShow() {
    if (this.data.posts.length > 0) {
      this.loadPosts();
    }
  },

  initForum() {
    db.collection('forum_posts').count({
      success: res => {
        if (res.total === 0) {
          let promises = seedPosts.map(post => db.collection('forum_posts').add({ data: post }));
          Promise.all(promises).then(() => this.loadPosts());
        } else {
          this.loadPosts();
        }
      },
      fail: () => this.loadPosts()
    });
  },

  loadPosts() {
    wx.showLoading({ title: '拉取帖子...' });
    db.collection('forum_posts').orderBy('timestamp', 'desc').get({
      success: res => {
        const records = res.data.map(p => {
          // 判断帖子是不是自己的
          p.isMine = (p.author_id === this.data.myOpenId);
          // 动态计算帖子时间
          if (p.timestamp) p.time = formatRelativeTime(p.timestamp);
          
          if (p.commentList) {
            p.commentList.forEach(c => {
              // 判断评论是不是自己的
              c.isMine = (c.author_id === this.data.myOpenId);
              // 动态计算评论时间
              if (c.timestamp) c.time = formatRelativeTime(c.timestamp);
            });
          }
          return p;
        });
        this.setData({ posts: records });
        wx.hideLoading();
      },
      fail: err => {
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    });
  },

  showPostModal() {
    this.setData({ showPostModal: true, postInput: '' });
  },

  hidePostModal() {
    this.setData({ showPostModal: false });
  },

  onPostInput(e) {
    this.setData({ postInput: e.detail.value });
  },

  submitPost() {
    if (!this.data.postInput.trim()) {
      wx.showToast({ title: '内容不能为空', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '发布中...' });
    const currentTimestamp = Date.now();
    const randomId = Math.floor(Math.random() * 9000) + 1000; 

    const newPost = {
      author_id: this.data.myOpenId,
      display_id: randomId.toString(),
      content: this.data.postInput,
      comments: 0,
      likes: 0,
      timestamp: currentTimestamp, // 写入真实时间戳
      commentList: []
    };

    db.collection('forum_posts').add({
      data: newPost,
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: '发布成功', icon: 'success' });
        this.hidePostModal();
        this.loadPosts();
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '发布失败', icon: 'none' });
      }
    });
  },

  deletePost(e) {
    const index = e.currentTarget.dataset.index;
    const post = this.data.posts[index];

    wx.showModal({
      title: '删除帖子',
      content: '确定要删除这条求助吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          db.collection('forum_posts').doc(post._id).remove({
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: '已删除' });
              this.loadPosts();
            }
          });
        }
      }
    });
  },

  likePost(e) {
    const index = e.currentTarget.dataset.index;
    let post = this.data.posts[index];
    
    post.isLiked ? (post.likes -= 1, post.isLiked = false) : (post.likes += 1, post.isLiked = true);
    this.setData({ [`posts[${index}]`]: post });
    wx.vibrateShort(); 

    db.collection('forum_posts').doc(post._id).update({
      data: { likes: post.likes }
    });
  },

  openComments(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ 
      currentPostIndex: index, 
      showCommentPanel: true,
      replyTarget: null,
      commentInput: ''
    });
  },

  closeComments() {
    this.setData({ 
      showCommentPanel: false, 
      inputFocus: false, 
      keyboardHeight: 0 // 关闭重置
    });
  },

  onKeyboardHeightChange(e) {
    this.setData({ keyboardHeight: e.detail.height || 0 });
  },

  onInputBlur() {
    this.setData({ inputFocus: false, keyboardHeight: 0 });
  },

  tapReply(e) {
    const name = e.currentTarget.dataset.name;
    this.setData({
      replyTarget: { name: name },
      inputFocus: true
    });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  submitComment() {
    if (!this.data.commentInput.trim()) {
      wx.showToast({ title: '写点什么吧', icon: 'none' });
      return;
    }

    const pIndex = this.data.currentPostIndex;
    let post = this.data.posts[pIndex];
    const currentTimestamp = Date.now(); 

    const randomId = Math.floor(Math.random() * 900) + 100;
    const myAnonName = `匿名牙友_${randomId}`;

    const newComment = {
      author_id: this.data.myOpenId,
      name: myAnonName,
      text: this.data.commentInput,
      timestamp: currentTimestamp, // 存真实时间戳
      time: '刚刚',
      likes: 0,
      isLiked: false,
      isMine: true,
      replyTo: this.data.replyTarget ? this.data.replyTarget.name : null
    };

    post.commentList.unshift(newComment);
    post.comments += 1;

    this.setData({
      [`posts[${pIndex}]`]: post,
      commentInput: '',
      replyTarget: null,
      inputFocus: false,
      keyboardHeight: 0
    });

    db.collection('forum_posts').doc(post._id).update({
      data: { 
        commentList: post.commentList,
        comments: post.comments
      },
      success: () => {
        wx.showToast({ title: '评论成功', icon: 'success' });
      }
    });
  },

  likeComment(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const pIndex = this.data.currentPostIndex;
    let post = this.data.posts[pIndex];
    let comment = post.commentList[cIndex];
    
    comment.isLiked ? (comment.likes -= 1, comment.isLiked = false) : (comment.likes += 1, comment.isLiked = true);
    this.setData({ [`posts[${pIndex}].commentList[${cIndex}]`]: comment });
    wx.vibrateShort(); 

    db.collection('forum_posts').doc(post._id).update({
      data: { commentList: post.commentList }
    });
  },

  deleteComment(e) {
    const cIndex = e.currentTarget.dataset.cindex;
    const pIndex = this.data.currentPostIndex;
    let post = this.data.posts[pIndex];

    wx.showModal({
      title: '删除评论',
      content: '确定要删除这条评论吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          post.commentList.splice(cIndex, 1); 
          post.comments -= 1; 

          this.setData({ [`posts[${pIndex}]`]: post });

          db.collection('forum_posts').doc(post._id).update({
            data: { 
              commentList: post.commentList,
              comments: post.comments
            },
            success: () => {
              wx.hideLoading();
              wx.showToast({ title: '已删除' });
            }
          });
        }
      }
    });
  }
});