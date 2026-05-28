module.exports = {
  _before: async function() {
    // 单用户模式，无需鉴权
  },

  /**
   * 获取云存储上传路径
   * @param {Object} data - { fileType, fileName }
   */
  async getUploadPath(data = {}) {
    const { fileType, fileName } = data;
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (fileType && !allowedTypes.includes(fileType)) {
      return { code: 400, msg: '不支持的文件类型' };
    }

    const ext = fileName ? fileName.split('.').pop() : 'jpg';
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const cloudPath = `notes/${dateStr}/${Date.now()}.${ext}`;

    return {
      code: 0,
      cloudPath
    };
  },

  /**
   * 上传文件到云存储
   * @param {Object} data - { fileBase64, fileName, cloudPath } 或 { filePath, cloudPath }
   */
  async uploadFile(data = {}) {
    const { cloudPath } = data;
    if (!cloudPath) {
      return { code: 400, msg: '参数不完整' };
    }

    let fileStream;

    if (data.fileBase64) {
      // base64 上传（Web 端编辑器用）
      const match = data.fileBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return { code: 400, msg: 'base64 格式无效' };
      }
      const buffer = Buffer.from(match[2], 'base64');
      fileStream = buffer;
    } else if (data.filePath) {
      // 本地路径上传（uni-app 端用）
      try {
        const result = await uniCloud.uploadFile({
          filePath: data.filePath,
          cloudPath,
          fileType: 'image'
        });
        return { code: 0, fileID: result.fileID, msg: '上传成功' };
      } catch (e) {
        return { code: 500, msg: '上传失败: ' + e.message };
      }
    } else {
      return { code: 400, msg: '请提供 fileBase64 或 filePath' };
    }

    try {
      const result = await uniCloud.uploadFile({
        fileStream,
        cloudPath
      });
      return { code: 0, fileID: result.fileID, msg: '上传成功' };
    } catch (e) {
      return { code: 500, msg: '上传失败: ' + e.message };
    }
  },

  /**
   * 获取临时下载链接
   * @param {Object} data - { fileList: ['fileID1', ...] }
   */
  async getTempFileURL(data = {}) {
    const { fileList } = data;
    if (!fileList || fileList.length === 0) {
      return { code: 400, msg: '请提供文件列表' };
    }

    const result = await uniCloud.getTempFileURL({ fileList });
    return { code: 0, data: result.fileList };
  },

  /**
   * 删除文件
   * @param {Object} data - { fileList: ['fileID1', ...] }
   */
  async deleteFile(data = {}) {
    const { fileList } = data;
    if (!fileList || fileList.length === 0) {
      return { code: 400, msg: '请提供文件列表' };
    }

    const result = await uniCloud.deleteFile({ fileList });
    return { code: 0, msg: '删除成功', data: result.fileList };
  }
};
