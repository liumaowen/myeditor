<template>
  <view class="note-detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text>加载中...</text>
    </view>

    <template v-else-if="note">
      <!-- 标题区 -->
      <view class="note-header">
        <text class="note-title">{{ note.title }}</text>
        <view class="note-meta">
          <text class="meta-text" v-if="note.category_name">分类: {{ note.category_name }}</text>
          <text class="meta-text">更新于 {{ formatDate(note.update_date) }}</text>
          <text class="meta-text">阅读 {{ note.view_count || 0 }} | 字数 {{ note.word_count || 0 }}</text>
        </view>
        <view class="note-tags" v-if="note.tags && note.tags.length > 0">
          <text class="tag" v-for="(tag, i) in note.tags" :key="i">{{ tag }}</text>
        </view>
      </view>

      <!-- 正文内容 -->
      <view class="note-body">
        <rich-text :nodes="note.content"></rich-text>
      </view>

      <!-- 底部操作栏 -->
      <view class="action-bar">
        <button size="mini" type="default" @tap="goEdit">编辑</button>
        <button size="mini" type="default" @tap="goVersion">版本</button>
        <button size="mini" type="default" @tap="goShare">分享</button>
        <button size="mini" type="warn" @tap="deleteNote">删除</button>
      </view>
    </template>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <text>笔记不存在或已被删除</text>
      <button size="mini" type="primary" @tap="goBack">返回</button>
    </view>
  </view>
</template>

<script>
  import { noteApi } from '@/common/note-api.js';

  export default {
    data() {
      return {
        noteId: '',
        note: null,
        loading: true
      };
    },
    onLoad(options) {
      if (options.id) {
        this.noteId = options.id;
        this.loadNote(options.id);
      }
    },
    methods: {
      async loadNote(id) {
        try {
          const res = await noteApi.getNote(id);
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
      goEdit() {
        uni.navigateTo({ url: `/pages/note/edit?id=${this.noteId}` });
      },
      goVersion() {
        uni.navigateTo({ url: `/pages/note/version?id=${this.noteId}` });
      },
      goShare() {
        uni.navigateTo({ url: `/pages/note/share?id=${this.noteId}` });
      },
      async deleteNote() {
        uni.showModal({
          title: '确认删除',
          content: '删除后可在草稿中恢复，确定删除吗？',
          success: async (res) => {
            if (res.confirm) {
              const result = await noteApi.deleteNote(this.noteId);
              if (result.code === 0) {
                uni.showToast({ title: '已删除', icon: 'success' });
                uni.$emit('note-saved');
                setTimeout(() => {
                  uni.navigateBack();
                }, 1500);
              }
            }
          }
        });
      },
      goBack() {
        uni.navigateBack();
      },
      formatDate(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
  };
</script>

<style scoped>
  .note-detail-page {
    min-height: 100vh;
    background: #fff;
  }

  .loading-state, .empty-state {
    text-align: center;
    padding: 60px 0;
    color: #999;
  }

  .note-header {
    padding: 20px 16px 16px;
    border-bottom: 1px solid #f0f0f0;
  }

  .note-title {
    font-size: 24px;
    font-weight: bold;
    display: block;
    margin-bottom: 12px;
  }

  .note-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .meta-text {
    font-size: 12px;
    color: #999;
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }

  .tag {
    font-size: 12px;
    padding: 2px 8px;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 4px;
  }

  .note-body {
    padding: 20px 16px;
    font-size: 16px;
    line-height: 1.8;
    padding-bottom: 100px;
  }

  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-around;
    padding: 12px;
    background: #fff;
    border-top: 1px solid #e0e0e0;
  }
</style>
