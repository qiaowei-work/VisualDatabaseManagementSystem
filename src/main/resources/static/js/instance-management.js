/**
 * 实例管理页面功能
 */
class InstanceManager {
    constructor() {
        this.initialize();
    }

    initialize() {
        this.bindEvents();
        this.loadInstanceList();
    }

    bindEvents() {
        // 绑定添加实例按钮事件
        const addInstanceBtn = document.getElementById('addInstanceBtn');
        if (addInstanceBtn) {
            console.log('找到添加实例按钮，绑定点击事件');
            addInstanceBtn.addEventListener('click', () => {
                // console.log('添加实例按钮被点击');
                // this.showAddInstanceModal();
                Utils.showMessage('功能开发中...', 'info');
            });
        } else {
            console.error('未找到添加实例按钮');
        }

        // 绑定模态框事件
        this.bindModalEvents();
        
        // 绑定刷新按钮事件
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadInstanceList());
        }
    }

    bindModalEvents() {
        // 等待DOM完全加载后再绑定事件
        setTimeout(() => {
            const modal = document.getElementById('addInstanceModal');
            if (modal) {
                const closeBtn = modal.querySelector('.close');
                const cancelBtn = document.getElementById('cancelInstanceBtn');

                // 关闭模态框
                [closeBtn, cancelBtn].forEach(btn => {
                    if (btn) {
                        btn.addEventListener('click', () => this.hideAddInstanceModal());
                    }
                });

                // 点击模态框外部关闭
                window.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.hideAddInstanceModal();
                    }
                });
            }

            // 测试实例连接 - 使用onclick直接绑定
            const testInstanceBtn = document.getElementById('testInstanceBtn');
            if (testInstanceBtn) {
                console.log('绑定测试按钮事件');
                testInstanceBtn.onclick = () => this.testNewInstance();
            } else {
                console.log('未找到测试按钮');
            }

            // 保存实例 - 使用onclick直接绑定
            const saveInstanceBtn = document.getElementById('saveInstanceBtn');
            if (saveInstanceBtn) {
                console.log('绑定保存按钮事件');
                saveInstanceBtn.onclick = () => this.saveInstance();
            } else {
                console.log('未找到保存按钮');
            }

            // 绑定调试按钮事件
            const debugFormBtn = document.getElementById('debugFormBtn');
            if (debugFormBtn) {
                console.log('绑定调试按钮事件');
                // debugFormBtn.onclick = () => this.debugForm();
                Utils.showMessage('添加用户功能开发中...', 'info');
            } else {
                console.log('未找到调试按钮');
            }
        }, 500); // 延迟500ms确保DOM完全加载
    }

    showAddInstanceModal() {
        console.log('显示添加实例模态框');
        const modal = document.getElementById('addInstanceModal');
        console.log('模态框元素:', modal);
        if (modal) {
            modal.style.display = 'block';
            console.log('模态框已显示');
            
            // 检查表单当前状态
            const form = document.getElementById('instanceForm');
            if (form) {
                const formElements = form.querySelectorAll('input, select');
                console.log('重置前表单元素值:');
                formElements.forEach((el, index) => {
                    console.log(`元素${index}: ID=${el.id}, value="${el.value}"`);
                });
                
                // 不清空表单，让用户输入保持
                // form.reset();
                console.log('跳过表单重置，保持用户输入');
            }
        } else {
            console.error('未找到添加实例模态框');
        }
    }

    hideAddInstanceModal() {
        const modal = document.getElementById('addInstanceModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    debugForm() {
        console.log('=== 表单调试信息 ===');
        
        // 显示模态框
        this.showAddInstanceModal();
        
        // 填充测试数据
        const testData = {
            name: '测试实例',
            host: 'localhost',
            port: '3306',
            username: 'root',
            password: 'password',
            database: 'test_db',
            environment: 'testing'
        };
        
        // 填充表单
        Object.keys(testData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.value = testData[key];
                console.log(`设置 ${key} = ${testData[key]}`);
            } else {
                console.log(`未找到元素: ${key}`);
            }
        });
        
        // 测试获取表单数据
        setTimeout(() => {
            console.log('测试获取表单数据...');
            const formData = this.getFormData();
            console.log('获取到的表单数据:', formData);
            
            // 测试表单验证
            console.log('测试表单验证...');
            const isValid = this.validateFormData(formData);
            console.log('验证结果:', isValid);
            
            if (isValid) {
                console.log('✅ 表单验证通过');
                Utils.showMessage('调试：表单验证通过！', 'success');
            } else {
                console.log('❌ 表单验证失败');
                Utils.showMessage('调试：表单验证失败！', 'error');
            }
        }, 500);
    }

    async testNewInstance() {
        console.log('testNewInstance called');
        
        // 检查模态框是否显示
        const modal = document.getElementById('addInstanceModal');
        console.log('模态框显示状态:', modal?.style?.display);
        
        const formData = this.getFormData();
        console.log('Form data retrieved:', formData);
        if (!this.validateFormData(formData)) {
            console.log('Form validation failed');
            return;
        }
        
        // 验证通过，继续处理
        console.log('表单验证通过，开始测试连接');

        try {
            Utils.showMessage('正在测试连接...', 'info');
            
            const response = await Utils.apiRequest('/visual-ops/api/instance/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response && response.code === 200) {
                Utils.showMessage('连接测试成功！', 'success');
            } else {
                Utils.showMessage(response?.message || '连接测试失败', 'error');
            }
        } catch (error) {
            console.error('连接测试失败:', error);
            Utils.showMessage('连接测试失败: ' + error.message, 'error');
        }
    }

    async saveInstance() {
        console.log('saveInstance called');
        
        // 检查模态框是否显示
        const modal = document.getElementById('addInstanceModal');
        console.log('模态框显示状态:', modal?.style?.display);
        
        const formData = this.getFormData();
        console.log('Form data retrieved:', formData);
        if (!this.validateFormData(formData)) {
            console.log('Form validation failed');
            return;
        }
        
        // 验证通过，继续处理
        console.log('表单验证通过，开始保存实例');

        try {
            Utils.showMessage('正在保存实例...', 'info');
            
            // 使用POST方法调用实例创建API
            const response = await Utils.apiRequest('/visual-ops/api/instance/addInstance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response && response.code === 200) {
                Utils.showMessage('实例添加成功！', 'success');
                this.hideAddInstanceModal();
                this.loadInstanceList(); // 重新加载实例列表
            } else {
                Utils.showMessage(response?.message || '实例添加失败', 'error');
            }
        } catch (error) {
            console.error('实例添加失败:', error);
            Utils.showMessage('实例添加失败: ' + error.message, 'error');
        }
    }

    getFormData() {
        // 检查模态框是否存在
        const modal = document.getElementById('addInstanceModal');
        console.log('模态框元素:', modal);
        console.log('模态框display样式:', modal?.style?.display);
        
        // 检查DOM元素是否存在
        const instanceNameEl = document.getElementById('instanceName');
        const hostEl = document.getElementById('host');
        const portEl = document.getElementById('port');
        const usernameEl = document.getElementById('username');
        const passwordEl = document.getElementById('password');
        const databaseEl = document.getElementById('database');
        const environmentEl = document.getElementById('environment');
        
        console.log('DOM元素检查:');
        console.log('instanceName:', instanceNameEl, 'value:', instanceNameEl?.value);
        console.log('host:', hostEl, 'value:', hostEl?.value);
        console.log('port:', portEl, 'value:', portEl?.value);
        console.log('username:', usernameEl, 'value:', usernameEl?.value);
        console.log('password:', passwordEl, 'value:', passwordEl?.value);
        console.log('database:', databaseEl, 'value:', databaseEl?.value);
        console.log('environment:', environmentEl, 'value:', environmentEl?.value);
        
        // 检查表单元素是否在模态框内
        if (modal) {
            const formElements = modal.querySelectorAll('input, select');
            console.log('模态框内表单元素数量:', formElements.length);
            formElements.forEach((el, index) => {
                console.log(`元素${index}: ID=${el.id}, value=${el.value}`);
            });
        }
        
        const formData = {
            name: instanceNameEl?.value || '',
            host: hostEl?.value || '',
            port: parseInt(portEl?.value || '3306'),
            username: usernameEl?.value || '',
            password: passwordEl?.value || '',
            database: databaseEl?.value || '',
            environment: environmentEl?.value || 'production'
        };
        
        console.log('getFormData result:', formData);
        return formData;
    }

    validateFormData(formData) {
        console.log('validateFormData input:', formData);
        console.log('name:', formData.name, 'host:', formData.host, 'username:', formData.username, 'password:', formData.password);
        
        // 详细检查每个字段
        const missingFields = [];
        if (!formData.name) missingFields.push('实例名称');
        if (!formData.host) missingFields.push('主机地址');
        if (!formData.username) missingFields.push('用户名');
        if (!formData.password) missingFields.push('密码');
        
        if (missingFields.length > 0) {
            Utils.showMessage(`请填写以下必填字段: ${missingFields.join(', ')}`, 'warning');
            console.log('验证失败：必填字段缺失', missingFields);
            return false;
        }

        if (formData.port <= 0 || formData.port > 65535) {
            Utils.showMessage('端口必须在1-65535之间', 'warning');
            console.log('验证失败：端口无效');
            return false;
        }

        console.log('验证通过');
        return true;
    }

    async loadInstanceList() {
        const tableBody = document.getElementById('instanceTableBody');
        if (!tableBody) return;

        try {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">正在加载实例数据...</td></tr>';
            
            // 从后端API获取实例数据
            const response = await Utils.apiRequest('/visual-ops/api/instance/list');

            if (response && response.code === 200 && response.data) {
                if (response.data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="8" class="text-center">暂无实例数据</td></tr>';
                    return;
                }

                tableBody.innerHTML = response.data.map(instance => `
                    <tr>
                        <td>${instance.name}</td>
                        <td>${instance.host}</td>
                        <td>${instance.port}</td>
                        <td>${instance.type || 'MySQL'}</td>
                        <td><span class="status-${instance.status === 1 ? 'active' : 'inactive'}">${instance.status === 1 ? '启用' : '禁用'}</span></td>
                        <td><span class="connection-${instance.connectionStatus === 1 ? 'success' : 'error'}">${instance.connectionStatus === 1 ? '连接成功' : '连接失败'}</span></td>
                        <td>${this.formatDate(instance.createTime)}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="InstanceManager.editInstance(${instance.id})">编辑</button>
                            <button class="btn btn-sm btn-outline-warning" onclick="InstanceManager.testConnection(${instance.id})">测试</button>
                            <button class="btn btn-sm btn-danger" onclick="InstanceManager.deleteInstance(${instance.id})">删除</button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tableBody.innerHTML = `<tr><td colspan="8" class="text-center">${response?.message || '加载失败'}</td></tr>`;
                console.error('获取实例数据失败:', response?.message);
            }
        } catch (error) {
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center">网络错误，请稍后重试</td></tr>';
            console.error('获取实例数据时发生错误:', error);
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
    }

    // 静态方法供HTML调用
    static async editInstance(id) {
        try {
            // 获取实例详情
            const response = await Utils.apiRequest(`/visual-ops/api/instance/${id}`);
            
            if (response && response.code === 200 && response.data) {
                const instance = response.data;
                
                // 填充表单数据
                document.getElementById('instanceName').value = instance.name || '';
                document.getElementById('host').value = instance.host || '';
                document.getElementById('port').value = instance.port || '3306';
                document.getElementById('username').value = instance.username || '';
                document.getElementById('password').value = instance.password || '';
                document.getElementById('database').value = instance.database || '';
                document.getElementById('environment').value = instance.environment || 'production';
                
                // 显示模态框
                instanceManager.showAddInstanceModal();
                
                // 修改保存按钮为更新模式
                const saveBtn = document.getElementById('saveInstanceBtn');
                if (saveBtn) {
                    saveBtn.textContent = '更新实例';
                    saveBtn.onclick = () => instanceManager.updateInstance(id);
                }
                
                // 修改模态框标题
                const modalTitle = document.querySelector('#addInstanceModal .modal-title');
                if (modalTitle) {
                    modalTitle.textContent = '编辑数据库实例';
                }
            } else {
                Utils.showMessage('获取实例详情失败', 'error');
            }
        } catch (error) {
            console.error('获取实例详情失败:', error);
            Utils.showMessage('获取实例详情失败: ' + error.message, 'error');
        }
    }

    static async testConnection(id) {
        try {
            Utils.showMessage('正在测试连接...', 'info');
            
            // 获取实例详情
            const response = await Utils.apiRequest(`/visual-ops/api/instance/${id}`);
            
            if (response && response.code === 200 && response.data) {
                const instance = response.data;
                
                // 测试连接
                const testResponse = await Utils.apiRequest('/visual-ops/api/instance/test-connection', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(instance)
                });
                
                if (testResponse && testResponse.code === 200) {
                    Utils.showMessage('连接测试成功！', 'success');
                } else {
                    Utils.showMessage(testResponse?.message || '连接测试失败', 'error');
                }
            } else {
                Utils.showMessage('获取实例信息失败', 'error');
            }
        } catch (error) {
            console.error('测试连接失败:', error);
            Utils.showMessage('测试连接失败: ' + error.message, 'error');
        }
    }

    static async deleteInstance(id) {
        if (confirm('确定要删除该实例吗？此操作不可恢复！')) {
            try {
                Utils.showMessage('正在删除实例...', 'info');
                
                const response = await Utils.apiRequest(`/visual-ops/api/instance/${id}`, {
                    method: 'DELETE'
                });
                
                if (response && response.code === 200) {
                    Utils.showMessage('实例删除成功！', 'success');
                    instanceManager.loadInstanceList(); // 重新加载实例列表
                } else {
                    Utils.showMessage(response?.message || '实例删除失败', 'error');
                }
            } catch (error) {
                console.error('删除实例失败:', error);
                Utils.showMessage('删除实例失败: ' + error.message, 'error');
            }
        }
    }

    async updateInstance(id) {
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) {
            return;
        }

        try {
            Utils.showMessage('正在更新实例...', 'info');
            
            const response = await Utils.apiRequest(`/visual-ops/api/instance/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response && response.code === 200) {
                Utils.showMessage('实例更新成功！', 'success');
                this.hideAddInstanceModal();
                this.loadInstanceList(); // 重新加载实例列表
                
                // 恢复保存按钮为添加模式
                const saveBtn = document.getElementById('saveInstanceBtn');
                if (saveBtn) {
                    saveBtn.textContent = '保存实例';
                    saveBtn.onclick = () => this.saveInstance();
                }
                
                // 恢复模态框标题
                const modalTitle = document.querySelector('#addInstanceModal .modal-title');
                if (modalTitle) {
                    modalTitle.textContent = '添加数据库实例';
                }
            } else {
                Utils.showMessage(response?.message || '实例更新失败', 'error');
            }
        } catch (error) {
            console.error('实例更新失败:', error);
            Utils.showMessage('实例更新失败: ' + error.message, 'error');
        }
    }
}

// 初始化实例管理器
let instanceManager;
document.addEventListener('DOMContentLoaded', function() {
    instanceManager = new InstanceManager();
});