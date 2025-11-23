// 确保Utils类可用
if (typeof Utils === 'undefined') {
    console.error('Utils类未定义，请检查utils.js是否正确加载');
}

document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    if (!Utils.checkAuth()) {
        return;
    }

    // 初始化用户信息
    initializeUserInfo();

    // 绑定事件
    bindEvents();

    // 初始化当前页面
    initializeCurrentPage();
});

function initializeUserInfo() {
    // 从localStorage获取用户信息
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const username = userInfo.username || '用户';
    const realName = userInfo.realName || username;

    // 更新页面显示
    const currentUsernameEl = document.getElementById('currentUsername');
    const headerUsernameEl = document.getElementById('headerUsername');
    
    if (currentUsernameEl) {
        currentUsernameEl.textContent = realName;
    }
    if (headerUsernameEl) {
        headerUsernameEl.textContent = realName;
    }
}

function bindEvents() {
    // 退出登录
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            logout();
        });
    }

    // 刷新按钮
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            location.reload();
        });
    }

    // 绑定页面特定事件
    bindPageSpecificEvents();
}

function initializeCurrentPage() {
    // 获取当前页面路径
    const currentPath = window.location.pathname;
    
    // 更新侧边栏按钮激活状态
    updateSidebarActiveState(currentPath);
    
    // 根据当前页面初始化相应功能
    if (currentPath === '/' || currentPath === '/dashboard') {
        initializeDashboardPage();
    } else if (currentPath === '/user-management') {
        initializeUserManagementPage();
    } else if (currentPath === '/instance-management') {
        initializeInstanceManagementPage();
    } else if (currentPath === '/system-monitoring') {
        initializeSystemMonitoringPage();
    } else if (currentPath === '/server-monitoring') {
        initializeSqlOperationPage();
    } else if (currentPath === '/warning-rules') {
        initializePerformanceAnalysisPage();
    } else if (currentPath === '/alert-history') {
        // 报警历史页面初始化
        console.log('初始化报警历史页面');
    }
}

function updateSidebarActiveState(currentPath) {
    // 获取所有侧边栏导航项
    const navItems = document.querySelectorAll('.nav-item');
    
    // 移除所有项的active类
    navItems.forEach(item => item.classList.remove('active'));
    
    // 标准化当前路径
    let targetPath = currentPath === '/' ? '/dashboard' : currentPath;
    
    // 根据当前路径设置相应的active类
    navItems.forEach(item => {
        const link = item.querySelector('a');
        if (link) {
            // 获取链接的href属性（浏览器会解析th:href为实际路径）
            const href = link.getAttribute('href') || '';
            
            // 直接匹配路径，处理可能的相对路径
            if (href === targetPath || href.endsWith(targetPath) || targetPath.endsWith(href)) {
                item.classList.add('active');
            }
            
            // 备用方案：如果直接匹配失败，根据文本内容匹配
            const navText = link.querySelector('.nav-text');
            if (navText) {
                const text = navText.textContent.trim();
                if ((text === '系统概览' && targetPath === '/dashboard') ||
                    (text === '用户管理' && targetPath === '/user-management') ||
                    (text === '实例管理' && targetPath === '/instance-management') ||
                    (text === '数据库监控' && targetPath === '/system-monitoring') ||
                    (text === '服务器监控' && targetPath === '/server-monitoring') ||
                    (text === '预警规则管理' && targetPath === '/warning-rules') ||
                    (text === '报警历史' && targetPath === '/alert-history')) {
                    item.classList.add('active');
                }
            }
        }
    });
}

function bindPageSpecificEvents() {
    // 绑定页面特定的事件处理
    
    // 用户管理页面事件
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
    
    const searchUserBtn = document.getElementById('searchUserBtn');
    if (searchUserBtn) {
        searchUserBtn.addEventListener('click', searchUsers);
    }
    
    const refreshUserList = document.getElementById('refreshUserList');
    if (refreshUserList) {
        refreshUserList.addEventListener('click', loadUserList);
    }
    
    // 实例管理页面事件 - 现在由instance-management.js处理
    // const addInstanceBtn = document.getElementById('addInstanceBtn');
    // if (addInstanceBtn) {
    //     addInstanceBtn.addEventListener('click', showAddInstanceModal);
    // }
    
    const searchInstanceBtn = document.getElementById('searchInstanceBtn');
    if (searchInstanceBtn) {
        searchInstanceBtn.addEventListener('click', searchInstances);
    }
    
    const refreshInstanceList = document.getElementById('refreshInstanceList');
    if (refreshInstanceList) {
        refreshInstanceList.addEventListener('click', loadInstanceList);
    }
    
    // 系统监控页面事件
    const startMonitoringBtn = document.getElementById('startMonitoringBtn');
    if (startMonitoringBtn) {
        startMonitoringBtn.addEventListener('click', startSystemMonitoring);
    }
    
    const stopMonitoringBtn = document.getElementById('stopMonitoringBtn');
    if (stopMonitoringBtn) {
        stopMonitoringBtn.addEventListener('click', stopSystemMonitoring);
    }
    
    // SQL操作页面事件
    const executeSqlBtn = document.getElementById('executeSqlBtn');
    if (executeSqlBtn) {
        executeSqlBtn.addEventListener('click', executeSql);
    }
    
    const clearSqlBtn = document.getElementById('clearSqlBtn');
    if (clearSqlBtn) {
        clearSqlBtn.addEventListener('click', clearSqlEditor);
    }
    
    const formatSqlBtn = document.getElementById('formatSqlBtn');
    if (formatSqlBtn) {
        formatSqlBtn.addEventListener('click', formatSql);
    }
    
    // 性能分析页面事件
    const refreshSlowQueries = document.getElementById('refreshSlowQueries');
    if (refreshSlowQueries) {
        refreshSlowQueries.addEventListener('click', loadSlowQueries);
    }
    
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', exportPerformanceReport);
    }
}

// 页面初始化函数
function initializeDashboardPage() {
    // 初始化仪表板页面
    loadDashboardData();
    
    // 设置定时刷新
    setInterval(loadDashboardData, 30000); // 30秒刷新一次
}

function initializeUserManagementPage() {
    // 初始化用户管理页面
    loadUserList();
}

function initializeInstanceManagementPage() {
    // 初始化实例管理页面
    loadInstanceList();
}

function initializeSystemMonitoringPage() {
    // 初始化系统监控页面
    if (typeof SystemMonitor !== 'undefined') {
        SystemMonitor.initialize();
    }
    loadDatabaseConnections();
}

function initializeSqlOperationPage() {
    // 初始化SQL操作页面
    loadDatabaseConnections();
}

function initializePerformanceAnalysisPage() {
    // 初始化性能分析页面
    loadSlowQueries();
    loadPerformanceMetrics();
}

// 退出登录
async function logout() {
    try {
        await Utils.apiRequest('/visual-ops/api/auth/logout', {
            method: 'POST'
        });
    } catch (error) {
        console.error('退出登录错误:', error);
    } finally {
        // 清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');

        // 跳转到登录页
        window.location.href = '/visual-ops/login';
    }
}

// 数据加载函数
async function loadDashboardData() {
    try {
        // 模拟加载数据
        setTimeout(() => {
            const instanceCount = document.getElementById('instanceCount');
            const onlineUsers = document.getElementById('onlineUsers');
            const todayQueries = document.getElementById('todayQueries');
            const alertsCount = document.getElementById('alertsCount');
            const systemStatus = document.getElementById('systemStatus');
            const recentActivity = document.getElementById('recentActivity');
            
            if (instanceCount) instanceCount.textContent = '3';
            if (onlineUsers) onlineUsers.textContent = '5';
            if (todayQueries) todayQueries.textContent = '1,234';
            if (alertsCount) alertsCount.textContent = '2';
            
            if (systemStatus) {
                systemStatus.innerHTML = `
                    <p>✅ 所有系统运行正常</p>
                    <p>📊 平均响应时间: 120ms</p>
                    <p>🔄 最后更新时间: ${new Date().toLocaleString()}</p>
                `;
            }
            
            if (recentActivity) {
                recentActivity.innerHTML = `
                    <p>👤 管理员 登录系统</p>
                    <p>🔍 用户 test 执行了查询</p>
                    <p>⚡ 实例 db-prod 性能正常</p>
                `;
            }
        }, 1000);
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
    }
}

async function loadUserList() {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
    
    try {
        // 从后端API获取用户数据
        const response = await Utils.apiRequest('/visual-ops/api/users/list');
        
        if (response && response.code === 200 && response.data) {
            // 处理后端返回的数据
            const users = response.data.map(user => ({
                ...user,
                status: user.status === 1 ? '启用' : '禁用',
                role: user.username === 'admin' ? '管理员' : '普通用户',
                createTime: formatDate(user.createTime)
            }));
            
            tableBody.innerHTML = users.map(user => `
                <tr>
                    <td>${user.username}</td>
                    <td>${user.realName}</td>
                    <td>${user.email}</td>
                    <td>${user.role}</td>
                    <td><span class="status-${user.status === '启用' ? 'active' : 'inactive'}">${user.status}</span></td>
                    <td>${user.createTime}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary">编辑</button>
                        <button class="btn btn-sm btn-danger">删除</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">${response?.message || '加载失败'}</td></tr>`;
            console.error('获取用户数据失败:', response?.message);
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">网络错误，请稍后重试</td></tr>';
        console.error('获取用户数据时发生错误:', error);
    }
}

async function loadInstanceList() {
    const tableBody = document.getElementById('instanceTableBody');
    if (!tableBody) return;
    
    try {
        // 从后端API获取实例数据
        const response = await Utils.apiRequest('/visual-ops/api/users/list');
        
        if (response && response.code === 200 && response.data) {
            // 处理后端返回的数据
            const instances = response.data.map(instance => ({
                ...instance,
                status: instance.status === 1 ? '运行中' : '已停止',
                createTime: formatDate(instance.createTime)
            }));
            
            tableBody.innerHTML = instances.map(instance => `
                <tr>
                    <td>${instance.name}</td>
                    <td>${instance.host}</td>
                    <td>${instance.port}</td>
                    <td>${instance.type}</td>
                    <td><span class="status-${instance.status === '运行中' ? 'active' : 'inactive'}">${instance.status}</span></td>
                    <td>${instance.version}</td>
                    <td>${instance.createTime}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary">编辑</button>
                        <button class="btn btn-sm btn-danger">删除</button>
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

async function loadDatabaseConnections() {
    const dbConnectionSelect = document.getElementById('dbConnectionSelect');
    const monitorInstanceSelect = document.getElementById('monitorInstanceSelect');
    
    if (!dbConnectionSelect && !monitorInstanceSelect) return;
    
    try {
        // 显示加载状态
        if (dbConnectionSelect) {
            dbConnectionSelect.innerHTML = '<option value="">加载中...</option>';
        }
        if (monitorInstanceSelect) {
            monitorInstanceSelect.innerHTML = '<option value="">加载中...</option>';
        }
        
        // 从后端API获取实例数据
        const response = await Utils.apiRequest('/visual-ops/api/users/list');
        
        if (response && response.code === 200 && response.data) {
            // 填充数据库连接选择器
            if (dbConnectionSelect) {
                dbConnectionSelect.innerHTML = '<option value="">选择数据库连接</option>';
                response.data.forEach(instance => {
                    const option = document.createElement('option');
                    option.value = instance.id;
                    option.textContent = `${instance.name} (${instance.host}:${instance.port})`;
                    dbConnectionSelect.appendChild(option);
                });
            }
            
            // 填充监控实例选择器
            if (monitorInstanceSelect) {
                monitorInstanceSelect.innerHTML = '<option value="">选择实例...</option>';
                response.data.forEach(instance => {
                    const option = document.createElement('option');
                    option.value = instance.id;
                    option.textContent = `${instance.name} (${instance.host}:${instance.port})`;
                    monitorInstanceSelect.appendChild(option);
                });
            }
        } else {
            if (dbConnectionSelect) {
                dbConnectionSelect.innerHTML = '<option value="">无法加载连接列表</option>';
            }
            if (monitorInstanceSelect) {
                monitorInstanceSelect.innerHTML = '<option value="">无法加载实例列表</option>';
            }
            console.error('获取实例数据失败:', response?.message);
        }
    } catch (error) {
        if (dbConnectionSelect) {
            dbConnectionSelect.innerHTML = '<option value="">加载连接列表时出错</option>';
        }
        if (monitorInstanceSelect) {
            monitorInstanceSelect.innerHTML = '<option value="">加载实例列表时出错</option>';
        }
        console.error('获取实例数据时发生错误:', error);
    }
}

async function loadSlowQueries() {
    const tableBody = document.getElementById('slowQueryTableBody');
    if (!tableBody) return;
    
    try {
        // 从后端API获取慢查询数据
        const response = await Utils.apiRequest('/visual-ops/api/performance/slow-queries');
        
        if (response && response.code === 200 && response.data) {
            tableBody.innerHTML = response.data.map(query => `
                <tr>
                    <td><code>${query.sql.substring(0, 50)}...</code></td>
                    <td>${query.executionTime}</td>
                    <td>${query.executionCount}</td>
                    <td>${(query.executionTime / query.executionCount).toFixed(2)}</td>
                    <td>${formatDate(query.lastExecutionTime)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary">详情</button>
                        <button class="btn btn-sm btn-outline-warning">优化</button>
                    </td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">${response?.message || '暂无慢查询数据'}</td></tr>`;
            console.error('获取慢查询数据失败:', response?.message);
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">网络错误，请稍后重试</td></tr>';
        console.error('获取慢查询数据时发生错误:', error);
    }
}

async function loadPerformanceMetrics() {
    const optimizationSuggestions = document.getElementById('optimizationSuggestions');
    const performanceReport = document.getElementById('performanceReport');
    
    if (!optimizationSuggestions && !performanceReport) return;
    
    try {
        // 从后端API获取性能指标数据
        const response = await Utils.apiRequest('/visual-ops/api/performance/metrics');
        
        if (response && response.code === 200 && response.data) {
            if (optimizationSuggestions) {
                optimizationSuggestions.innerHTML = response.data.suggestions.map(suggestion => `
                    <div class="alert alert-info">
                        <strong>${suggestion.type}</strong>: ${suggestion.content}
                    </div>
                `).join('');
            }
            
            if (performanceReport) {
                performanceReport.innerHTML = `
                    <h6>性能概览</h6>
                    <p>平均响应时间: ${response.data.avgResponseTime}ms</p>
                    <p>CPU使用率: ${response.data.cpuUsage}%</p>
                    <p>内存使用率: ${response.data.memoryUsage}%</p>
                    <p>连接数: ${response.data.connectionCount}</p>
                `;
            }
        } else {
            if (optimizationSuggestions) {
                optimizationSuggestions.innerHTML = '<p class="text-muted">暂无优化建议</p>';
            }
            if (performanceReport) {
                performanceReport.innerHTML = '<p class="text-muted">性能数据加载失败</p>';
            }
            console.error('获取性能指标失败:', response?.message);
        }
    } catch (error) {
        if (optimizationSuggestions) {
            optimizationSuggestions.innerHTML = '<p class="text-muted">获取优化建议时出错</p>';
        }
        if (performanceReport) {
            performanceReport.innerHTML = '<p class="text-muted">获取性能报告时出错</p>';
        }
        console.error('获取性能指标时发生错误:', error);
    }
}

// 页面功能函数
function showAddUserModal() {
    Utils.showMessage('添加用户功能开发中...', 'info');
}

function showAddInstanceModal() {
    Utils.showMessage('添加实例功能开发中...', 'info');
}

function searchUsers() {
    const searchInput = document.getElementById('searchUserInput');
    if (searchInput) {
        Utils.showMessage(`搜索用户: ${searchInput.value}`, 'info');
    }
}

function searchInstances() {
    const searchInput = document.getElementById('searchInstanceInput');
    if (searchInput) {
        Utils.showMessage(`搜索实例: ${searchInput.value}`, 'info');
    }
}

function startSystemMonitoring() {
    const monitorInstanceSelect = document.getElementById('monitorInstanceSelect');
    if (monitorInstanceSelect && monitorInstanceSelect.value) {
        Utils.showMessage(`开始监控实例: ${monitorInstanceSelect.options[monitorInstanceSelect.selectedIndex].text}`, 'success');
    } else {
        Utils.showMessage('请先选择要监控的实例', 'warning');
    }
}

function stopSystemMonitoring() {
    Utils.showMessage('停止系统监控', 'info');
}

function executeSql() {
    const sqlEditor = document.getElementById('sqlEditor');
    const sqlResult = document.getElementById('sqlResult');
    
    if (sqlEditor && sqlResult) {
        const sql = sqlEditor.value.trim();
        if (sql) {
            sqlResult.innerHTML = `
                <div class="alert alert-success">
                    <strong>执行成功</strong>
                    <p>SQL: <code>${sql}</code></p>
                    <p>影响行数: 1</p>
                    <p>执行时间: 0.05秒</p>
                </div>
            `;
        } else {
            Utils.showMessage('请输入SQL语句', 'warning');
        }
    }
}

function clearSqlEditor() {
    const sqlEditor = document.getElementById('sqlEditor');
    if (sqlEditor) {
        sqlEditor.value = '';
        Utils.showMessage('SQL编辑器已清空', 'info');
    }
}

function formatSql() {
    const sqlEditor = document.getElementById('sqlEditor');
    if (sqlEditor) {
        Utils.showMessage('SQL格式化功能开发中...', 'info');
    }
}

function exportPerformanceReport() {
    Utils.showMessage('性能报告导出功能开发中...', 'info');
}

// 工具函数
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
}