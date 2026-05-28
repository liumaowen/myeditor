<template>
  <view class="category-page">
    <view class="category-list">
      <view v-if="categories.length === 0" class="empty-state">
        <text>暂无分类，点击右下角 + 创建</text>
      </view>

      <view
        v-for="(cat, index) in categories"
        :key="cat._id"
        class="category-item"
      >
        <view class="category-info" @tap="selectCategory(cat)">
          <view
            class="color-dot"
            :style="{ background: cat.color || '#1296db' }"
          ></view>
          <text class="category-name">{{ cat.name }}</text>
          <text class="category-count">({{ cat.note_count || 0 }})</text>
        </view>
        <view class="category-actions">
          <button size="mini" type="default" @tap="editCategory(cat)">编辑</button>
          <button size="mini" type="warn" @tap="deleteCategory(cat)">删除</button>
        </view>
      </view>
    </view>

    <!-- 新建按钮 -->
    <view class="fab-button" @tap="addCategory">
      <text>+</text>
    </view>

    <!-- 编辑弹窗 -->
    <uni-popup ref="editPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-title">{{ editingCategory ? '编辑分类' : '新建分类' }}</view>
        <input
          class="input-field"
          v-model="form.name"
          placeholder="分类名称"
          maxlength="50"
        />
        <view class="color-picker">
          <text class="color-label">颜色:</text>
          <view
            v-for="color in colorOptions"
            :key="color"
            class="color-option"
            :class="{ selected: form.color === color }"
            :style="{ background: color }"
            @tap="form.color = color"
          ></view>
        </view>
        <view class="popup-actions">
          <button size="mini" type="default" @tap="closePopup">取消</button>
          <button size="mini" type="primary" @tap="saveCategory">保存</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
  import { noteApi } from '@/common/note-api.js';

  export default {
    data() {
      return {
        categories: [],
        editingCategory: null,
        form: {
          name: '',
          color: '#1296db'
        },
        colorOptions: [
          '#1296db', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#795548'
        ]
      };
    },
    onLoad() {
      this.loadCategories();
    },
    methods: {
      async loadCategories() {
        const res = await noteApi.listCategories();
        if (res.code === 0) {
          this.categories = res.data || [];
        }
      },
      addCategory() {
        this.editingCategory = null;
        this.form = { name: '', color: '#1296db' };
        this.$refs.editPopup.open();
      },
      editCategory(cat) {
        this.editingCategory = cat;
        this.form = { name: cat.name, color: cat.color || '#1296db' };
        this.$refs.editPopup.open();
      },
      closePopup() {
        this.$refs.editPopup.close();
      },
      async saveCategory() {
        if (!this.form.name.trim()) {
          uni.showToast({ title: '请输入分类名称', icon: 'none' });
          return;
        }

        try {
          if (this.editingCategory) {
            await noteApi.updateCategory(this.editingCategory._id, {
              name: this.form.name.trim(),
              color: this.form.color
            });
          } else {
            await noteApi.createCategory({
              name: this.form.name.trim(),
              color: this.form.color
            });
          }
          uni.showToast({ title: '保存成功', icon: 'success' });
          this.closePopup();
          this.loadCategories();
        } catch (e) {
          uni.showToast({ title: '保存失败: ' + e.message, icon: 'none' });
        }
      },
      async deleteCategory(cat) {
        uni.showModal({
          title: '确认删除',
          content: `确定删除分类「${cat.name}」吗？`,
          success: async (res) => {
            if (res.confirm) {
              await noteApi.deleteCategory(cat._id);
              uni.showToast({ title: '已删除', icon: 'success' });
              this.loadCategories();
            }
          }
        });
      },
      selectCategory(cat) {
        // 跳转到笔记列表，筛选该分类
        uni.switchTab({ url: '/pages/note/list' });
      }
    }
  };
</script>

<style scoped>
  .category-page {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .category-list {
    padding: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 0;
    color: #999;
  }

  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 8px;
  }

  .category-info {
    display: flex;
    align-items: center;
    flex: 1;
  }

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 6px;
    margin-right: 12px;
  }

  .category-name {
    font-size: 16px;
    flex: 1;
  }

  .category-count {
    font-size: 14px;
    color: #999;
    margin-left: 8px;
  }

  .category-actions {
    display: flex;
    gap: 4px;
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

  .popup-content {
    padding: 20px;
    background: #fff;
    border-radius: 12px 12px 0 0;
  }

  .popup-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 16px;
  }

  .input-field {
    height: 40px;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 0 12px;
    margin-bottom: 16px;
  }

  .color-picker {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .color-label {
    font-size: 14px;
    color: #666;
    margin-right: 8px;
  }

  .color-option {
    width: 28px;
    height: 28px;
    border-radius: 14px;
    border: 2px solid transparent;
  }

  .color-option.selected {
    border-color: #333;
  }

  .popup-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>
