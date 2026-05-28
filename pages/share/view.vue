<template>
  <view class="share-view-page">
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <view v-else-if="note" class="note-container">
      <view class="note-header">
        <text class="note-title">{{ note.title }}</text>
        <text class="note-date">{{ formatDate(note.create_date) }}</text>
      </view>
      <view class="note-body">
        <rich-text :nodes="note.content"></rich-text>
      </view>
      <view class="note-footer">
        <text class="footer-text">更新于 {{ formatDate(note.update_date) }}</text>
      </view>
    </view>

    <view v-else class="error-state">
      <text>分享链接无效或已过期</text>
    </view>
  </view>
</template>

<script>
  import { noteApi } from '@/common/note-api.js';

  export default {
    data() {
      return {
        shareCode: '',
        note: null,
        loading: true
      };
    },
    onLoad(options) {
      if (options.code) {
        this.shareCode = options.code;
        this.loadSharedNote(options.code);
      }
    },
    methods: {
      async loadSharedNote(code) {
        try {
          const res = await noteApi.getSharedNote(code);
          if (res.code === 0) {
            this.note = res.data;
          } else {
            uni.showToast({ title: res.msg, icon: 'none' });
          }
        } catch (e) {
          uni.showToast({ title: '加载失败', icon: 'none' });
        }
        this.loading = false;
      },
      formatDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
  };
</script>

<style scoped>
  .share-view-page {
    min-height: 100vh;
    background: #fff;
  }

  .loading-state, .error-state {
    text-align: center;
    padding: 60px 0;
    color: #999;
  }

  .note-container {
    padding: 20px 16px;
  }

  .note-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .note-title {
    font-size: 24px;
    font-weight: bold;
    display: block;
    margin-bottom: 8px;
  }

  .note-date {
    font-size: 12px;
    color: #999;
  }

  .note-body {
    font-size: 16px;
    line-height: 1.8;
  }

  .note-footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }

  .footer-text {
    font-size: 12px;
    color: #999;
  }
</style>
