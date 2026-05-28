<template>
  <view class="note-list-page">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        placeholder="搜索笔记..."
        v-model="keyword"
        @confirm="onSearch"
      />
      <button size="mini" type="primary" @tap="onSearch">搜索</button>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker mode="selector" :range="categories" range-key="name" @change="onCategoryChange">
        <view class="filter-item">{{ currentCategoryName || '全部分类' }}</view>
      </picker>
      <view class="filter-divider"></view>
      <picker mode="selector" :range="statusOptions" range-key="text" @change="onStatusChange">
        <view class="filter-item">{{ currentStatusText || '全部状态' }}</view>
      </picker>
    </view>

    <!-- 笔记列表 -->
    <scroll-view
      class="note-list"
      scroll-y
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="noteList.length === 0" class="empty-state">
        <text>暂无笔记，点击右下角 + 创建</text>
      </view>

      <view
        v-for="(note, index) in noteList"
        :key="note._id"
        class="note-item"
        @tap="goDetail(note._id)"
      >
        <view class="note-header">
          <text class="note-title">{{ note.title || '无标题' }}</text>
          <text class="note-status" :class="'status-' + note.status">
            {{ note.status === 0 ? '草稿' : '已发布' }}
          </text>
        </view>
        <view class="note-content">
          <text class="note-summary">{{ getSummary(note.plain_text) }}</text>
        </view>
        <view class="note-footer">
          <text class="note-date">{{ formatDate(note.update_date) }}</text>
          <text class="note-views">阅读 {{ note.view_count || 0 }}</text>
        </view>
        <view class="note-tags" v-if="note.tags && note.tags.length > 0">
          <text class="tag" v-for="(tag, i) in note.tags" :key="i">{{ tag }}</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more">
        <text>加载中...</text>
      </view>
      <view v-else-if="noteList.length > 0" class="load-more">
        <text>没有更多了</text>
      </view>
    </scroll-view>

    <!-- 新建按钮 -->
    <view class="fab-button" @tap="goEdit">
      <text>+</text>
    </view>
  </view>
</template>

<script>
  import { noteApi } from '@/common/note-api.js';

  export default {
    data() {
      return {
        keyword: '',
        noteList: [],
        categories: [],
        statusOptions: [
          { text: '全部状态', value: '' },
          { text: '草稿', value: 0 },
          { text: '已发布', value: 1 }
        ],
        currentCategory: '',
        currentStatus: '',
        page: 1,
        pageSize: 20,
        hasMore: true,
        loading: false,
        refreshing: false
      };
    },
    computed: {
      currentCategoryName() {
        const cat = this.categories.find(c => c._id === this.currentCategory);
        return cat ? cat.name : '';
      },
      currentStatusText() {
        const opt = this.statusOptions.find(s => s.value === this.currentStatus);
        return opt ? opt.text : '';
      }
    },
    onLoad() {
      this.loadCategories();
      this.loadNotes();
    },
    onShow() {
      uni.$once('note-saved', this.onRefresh);
    },
    onPullDownRefresh() {
      this.onRefresh();
    },
    methods: {
      async loadNotes(isLoadMore = false) {
        if (this.loading) return;
        this.loading = true;

        try {
          const res = await noteApi.listNotes({
            keyword: this.keyword,
            category_id: this.currentCategory,
            status: this.currentStatus,
            page: isLoadMore ? this.page : 1,
            pageSize: this.pageSize
          });

          if (res.code === 0) {
            if (isLoadMore) {
              this.noteList = this.noteList.concat(res.data);
            } else {
              this.noteList = res.data;
            }
            this.hasMore = this.noteList.length < res.total;
            this.page = isLoadMore ? this.page + 1 : 2;
          }
        } catch (e) {
          uni.showToast({ title: '加载失败', icon: 'none' });
        }

        this.loading = false;
      },
      loadMore() {
        if (this.hasMore && !this.loading) {
          this.loadNotes(true);
        }
      },
      async onRefresh() {
        this.refreshing = true;
        this.page = 1;
        await this.loadNotes();
        this.refreshing = false;
        uni.stopPullDownRefresh();
      },
      onSearch() {
        this.page = 1;
        this.loadNotes();
      },
      onCategoryChange(e) {
        const index = e.detail.value;
        this.currentCategory = this.categories[index]._id;
        this.page = 1;
        this.loadNotes();
      },
      onStatusChange(e) {
        const index = e.detail.value;
        this.currentStatus = this.statusOptions[index].value;
        this.page = 1;
        this.loadNotes();
      },
      async loadCategories() {
        const res = await noteApi.listCategories();
        if (res.code === 0) {
          this.categories = res.data || [];
        }
      },
      goDetail(id) {
        uni.navigateTo({ url: `/pages/note/detail?id=${id}` });
      },
      goEdit() {
        uni.navigateTo({ url: '/pages/note/edit' });
      },
      getSummary(text) {
        if (!text) return '';
        return text.length > 100 ? text.substring(0, 100) + '...' : text;
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
  .note-list-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f5f5f5;
  }

  .search-bar {
    display: flex;
    padding: 12px;
    background: #fff;
    gap: 8px;
  }

  .search-input {
    flex: 1;
    height: 36px;
    background: #f0f0f0;
    border-radius: 18px;
    padding: 0 16px;
    font-size: 14px;
  }

  .filter-bar {
    display: flex;
    padding: 8px 12px;
    background: #fff;
    border-bottom: 1px solid #e0e0e0;
  }

  .filter-item {
    padding: 4px 12px;
    font-size: 14px;
    color: #333;
  }

  .filter-divider {
    width: 1px;
    height: 20px;
    background: #e0e0e0;
    margin: 0 8px;
  }

  .note-list {
    flex: 1;
    padding: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 0;
    color: #999;
  }

  .note-item {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .note-title {
    font-size: 16px;
    font-weight: bold;
    flex: 1;
  }

  .note-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 8px;
  }

  .status-0 {
    background: #fff3e0;
    color: #ff9800;
  }

  .status-1 {
    background: #e8f5e9;
    color: #4caf50;
  }

  .note-content {
    margin-bottom: 8px;
  }

  .note-summary {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
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

  .load-more {
    text-align: center;
    padding: 16px;
    color: #999;
    font-size: 14px;
  }

  .fab-button {
    position: fixed;
    bottom: 80px;
    right: 24px;
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: #1296db;
    color: #fff;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(18, 150, 219, 0.4);
  }
</style>
