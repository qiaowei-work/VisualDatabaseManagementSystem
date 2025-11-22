/**
 * 用户管理模块
 */
class UserManagement {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.init();
    }

    init() {
        this.bindEvents();
        // this.loadCurrentUser();
        this.loadUsers();
    }

    // 绑定事件
    bindEvents() {
        // 刷新按钮
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadUsers());
        }

        // 添加用户按钮
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        // 退出登录按钮
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // 加载当前用户信息
    async loadCurrentUser() {
        try {
            const response = await Utils.apiRequest('/visual-ops/api/user/current');
            if (response && response.code === 200 && response.data) {
                this.currentUser = response.data;
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('加载当前用户信息失败:', error);
            // 如果获取失败，使用默认信息
            this.updateUserInfo('用户', '系统管理员');
        }
    }

    // 更新用户信息显示
    updateUserInfo(username = '管理员', role = '系统管理员') {
        const currentUsername = document.getElementById('currentUsername');
        const headerUsername = document.getElementById('headerUsername');
        
        if (currentUsername) {
            currentUsername.textContent = username;
        }
        if (headerUsername) {
            headerUsername.textContent = username;
        }

        // 更新用户角色
        const userRole = document.querySelector('.user-role');
        if (userRole) {
            userRole.textContent = role;
        }
    }

    // 加载用户列表
    async loadUsers() {
        try {
            console.log('开始加载用户列表...');
            const response = await Utils.apiRequest('/visual-ops/api/users/list');
            console.log('用户列表响应:', response);
            
            if (response && response.code === 200 && response.data) {
                this.users = response.data;
                this.renderUserTable();
                Utils.showMessage('用户列表加载成功', 'success');
            } else {
                console.error('获取用户列表失败:', response?.message);
                this.showError('获取用户列表失败: ' + (response?.message || '未知错误'));
            }
        } catch (error) {
            console.error('加载用户列表失败:', error);
            this.showError('加载用户列表失败: ' + error.message);
        }
    }

    // 渲染用户表格
    renderUserTable() {
        const tbody = document.getElementById('userTableBody');
        if (!tbody) {
            console.error('用户表格tbody元素未找到');
            return;
        }

        if (!this.users || this.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">暂无用户数据</td></tr>';
            this.updateStatistics(0, 0, 0);
            return;
        }

        tbody.innerHTML = this.users.map(user => this.createUserRow(user)).join('');
        
        // 更新统计信息
        this.updateStatistics();
        
        // 绑定操作按钮事件
        this.bindUserActionEvents();
    }

    // 创建用户行
    createUserRow(user) {
        const statusBadge = this.getStatusBadge(user.status);
        const roleText = this.getRoleText(user.role);
        const createTime = this.formatDate(user.createTime);

        return `
            <tr data-user-id="${user.id}">
                <td>${this.escapeHtml(user.username)}</td>
                <td>${this.escapeHtml(user.realName || '-')}</td>
                <td>${this.escapeHtml(user.email || '-')}</td>
                <td>${roleText}</td>
                <td>${statusBadge}</td>
                <td>${createTime}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-user-btn" data-user-id="${user.id}">
                            编辑
                        </button>
                        <button class="btn btn-sm ${user.status === 1 ? 'btn-warning' : 'btn-success'} toggle-status-btn" 
                                data-user-id="${user.id}" data-status="${user.status}">
                            ${user.status === 1 ? '禁用' : '启用'}
                        </button>
                        <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}">
                            删除
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    // 获取状态标签
    getStatusBadge(status) {
        if (status === 1) {
            return '<span class="status-badge status-active">启用</span>';
        } else {
            return '<span class="status-badge status-inactive">禁用</span>';
        }
    }

    // 获取角色文本
    getRoleText(role) {
        const roleMap = {
            'admin': '管理员',
            'user': '普通用户',
            'operator': '运维人员',
            'developer': '开发人员'
        };
        return roleMap[role] || role || '未知角色';
    }

    // 格式化日期
    formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateStr;
        }
    }

    // HTML转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 更新统计信息
    updateStatistics(total = null, active = null, inactive = null) {
        if (total === null && this.users) {
            total = this.users.length;
            active = this.users.filter(user => user.status === 1).length;
            inactive = this.users.filter(user => user.status === 0).length;
        }

        const totalEl = document.getElementById('totalUsers');
        const activeEl = document.getElementById('activeUsers');
        const inactiveEl = document.getElementById('inactiveUsers');

        if (totalEl) totalEl.textContent = total || 0;
        if (activeEl) activeEl.textContent = active || 0;
        if (inactiveEl) inactiveEl.textContent = inactive || 0;
    }

    // 绑定用户操作事件
    bindUserActionEvents() {
        // 编辑按钮
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.editUser(userId);
            });
        });

        // 状态切换按钮
        document.querySelectorAll('.toggle-status-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                const currentStatus = parseInt(e.target.dataset.status);
                this.toggleUserStatus(userId, currentStatus);
            });
        });

        // 删除按钮
        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = e.target.dataset.userId;
                this.deleteUser(userId);
            });
        });
    }

    // 显示添加用户模态框
    showAddUserModal() {
        // 这里可以实现添加用户的模态框
        Utils.showMessage('添加用户功能开发中...', 'info');
    }

    // 编辑用户
    editUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            Utils.showMessage('用户不存在', 'error');
            return;
        }
        
        // 这里可以实现编辑用户的模态框
        Utils.showMessage(`编辑用户: ${user.username}`, 'info');
    }

    // 切换用户状态
    async toggleUserStatus(userId, currentStatus) {
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            Utils.showMessage('用户不存在', 'error');
            return;
        }

        const newStatus = currentStatus === 1 ? 0 : 1;
        const actionText = newStatus === 1 ? '启用' : '禁用';

        if (!confirm(`确定要${actionText}用户 "${user.username}" 吗？`)) {
            return;
        }

        try {
            const response = await Utils.apiRequest(`/api/user/${userId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response && response.code === 200) {
                Utils.showMessage(`用户${actionText}成功`, 'success');
                this.loadUsers(); // 重新加载用户列表
            } else {
                Utils.showMessage(response?.message || `${actionText}用户失败`, 'error');
            }
        } catch (error) {
            console.error('切换用户状态失败:', error);
            Utils.showMessage(`${actionText}用户失败: ` + error.message, 'error');
        }
    }

    // 删除用户
    async deleteUser(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) {
            Utils.showMessage('用户不存在', 'error');
            return;
        }

        if (!confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`)) {
            return;
        }

        try {
            const response = await Utils.apiRequest(`/api/user/${userId}`, {
                method: 'DELETE'
            });

            if (response && response.code === 200) {
                Utils.showMessage('用户删除成功', 'success');
                this.loadUsers(); // 重新加载用户列表
            } else {
                Utils.showMessage(response?.message || '删除用户失败', 'error');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            Utils.showMessage('删除用户失败: ' + error.message, 'error');
        }
    }

    // 显示错误信息
    showError(message) {
        const tbody = document.getElementById('userTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-error">${message}</td></tr>`;
        }
        Utils.showMessage(message, 'error');
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            // 清除本地存储的用户信息
            localStorage.removeItem('currentUser');
            
            // 跳转到登录页面
            window.location.href = '/login';
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('用户管理页面加载完成');
    new UserManagement();
});