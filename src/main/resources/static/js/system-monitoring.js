// 系统监控模块JavaScript - 重构为Grafana集成版本
class SystemMonitor {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadInstances();
        // 初始化时检查实例选择状态，控制相关元素显示
        const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
        if (databaseInstanceSelect) {
            // 使用updateControlState方法统一处理所有需要根据实例选择状态控制的元素
            // 包括按钮、模态框内容和iframe显示
            this.updateControlState(databaseInstanceSelect.value);
            
            // 确保模态框初始状态正确
            const modal = document.getElementById('addInstanceModal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
    }

    bindEvents() {
        // 数据库实例选择
        const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
        if (databaseInstanceSelect) {
            databaseInstanceSelect.addEventListener('change', (e) => {
                const instanceId = e.target.value;
                this.updateControlState(instanceId);
                
                // 通知Grafana监控系统实例变更
                if (window.grafanaMonitor) {
                    window.grafanaMonitor.onInstanceChange(instanceId);
                }
            });
        }
        
        // 仪表盘选择
        const dashboardSelect = document.getElementById('dashboardSelect');
        if (dashboardSelect) {
            dashboardSelect.addEventListener('change', (e) => {
                const dashboardId = e.target.value;
                if (window.grafanaMonitor) {
                    window.grafanaMonitor.loadDashboard(dashboardId);
                }
            });
        }
        
        // 实例管理按钮
        const addInstanceBtn = document.getElementById('addInstanceBtn');
        if (addInstanceBtn) {
            addInstanceBtn.addEventListener('click', () => this.showAddInstanceModal());
        }
        
        const editInstanceBtn = document.getElementById('editInstanceBtn');
        if (editInstanceBtn) {
            editInstanceBtn.addEventListener('click', () => this.editSelectedInstance());
        }
        
        const deleteInstanceBtn = document.getElementById('deleteInstanceBtn');
        if (deleteInstanceBtn) {
            deleteInstanceBtn.addEventListener('click', () => this.deleteSelectedInstance());
        }
        
        // 仪表盘控制按钮
        const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', () => this.refreshDashboard());
        }
        
        const openInNewWindowBtn = document.getElementById('openInNewWindowBtn');
        if (openInNewWindowBtn) {
            openInNewWindowBtn.addEventListener('click', () => this.openDashboardInNewWindow());
        }
        
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // 测试连接按钮已移除

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshData());
        }

        // 模态框事件
        this.bindModalEvents();
    }

    bindModalEvents() {
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

        // 测试实例连接
        const testInstanceBtn = document.getElementById('testInstanceBtn');
        if (testInstanceBtn) {
            testInstanceBtn.addEventListener('click', () => this.testNewInstance());
        }

        // 保存实例
        const saveInstanceBtn = document.getElementById('saveInstanceBtn');
        if (saveInstanceBtn) {
            saveInstanceBtn.addEventListener('click', () => this.saveInstance());
        }
    }

    async loadInstances() {
        try {
            const select = document.getElementById('instanceSelect');
            if (!select) {
                console.error('实例选择器未找到');
                return;
            }

            // 从后端API获取实例数据
            const response = await Utils.apiRequest('/visual-ops/api/monitoring/instances');

            if (response && response.code === 200 && response.data) {
                // 清空现有选项（保留第一个提示选项）
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }

                // 添加实例选项
                response.data.forEach(instance => {
                    const option = document.createElement('option');
                    option.value = instance.id;
                    option.textContent = `${instance.name} (${instance.host})`;
                    select.appendChild(option);
                });

                // 通知Grafana监控系统实例数据已加载
                if (window.grafanaMonitor) {
                    window.grafanaMonitor.setInstances(response.data);
                }
            } else {
                select.innerHTML = '<option value="">获取实例数据失败</option>';
                console.error('获取实例数据失败:', response?.message);
            }

        } catch (error) {
            console.error('加载实例列表失败:', error);
            const select = document.getElementById('instanceSelect');
            if (select) {
                select.innerHTML = '<option value="">加载实例列表时出错</option>';
            }
            Utils.showMessage('加载实例列表失败: ' + error.message, 'error');
        }
    }

    updateControlState(instanceId) {
        // 启用或禁用控制按钮
        const editInstanceBtn = document.getElementById('editInstanceBtn');
        const deleteInstanceBtn = document.getElementById('deleteInstanceBtn');
        
        if (editInstanceBtn && deleteInstanceBtn) {
            const hasSelectedInstance = !!instanceId;
            editInstanceBtn.disabled = !hasSelectedInstance;
            deleteInstanceBtn.disabled = !hasSelectedInstance;
        }
        
        // 控制添加实例模态框内容显示
        const modalContent = document.querySelector('#addInstanceModal .modal-content');
        if (modalContent) {
            // 确保当没有选择数据库实例时，模态框内容不会显示
            modalContent.style.display = instanceId ? 'block' : 'none';
        }
        
        // 控制Grafana iframe显示
        const grafanaIframe = document.getElementById('grafanaIframe');
        if (grafanaIframe) {
            if (!instanceId) {
                // 隐藏iframe
                grafanaIframe.style.display = 'none';
                
                // // 检查是否已经存在提示元素，如果不存在则创建
                // let placeholderElement = document.getElementById('noInstanceSelectedPlaceholder');
                // if (!placeholderElement) {
                //     // 创建提示占位元素
                //     placeholderElement = document.createElement('div');
                //     placeholderElement.id = 'noInstanceSelectedPlaceholder';
                //     placeholderElement.className = 'alert alert-info text-center';
                //     placeholderElement.style.padding = '40px';
                //     placeholderElement.style.margin = '0';
                //     placeholderElement.textContent = '请选择实例';
                    
                //     // 将提示元素插入到iframe的位置
                //     grafanaIframe.parentNode.insertBefore(placeholderElement, grafanaIframe);
                // } else {
                //     // 显示已存在的提示元素
                //     placeholderElement.style.display = 'block';
                // }
            } else {
                // 显示iframe
                grafanaIframe.style.display = 'block';
                
                // 隐藏提示元素（如果存在）
                const placeholderElement = document.getElementById('noInstanceSelectedPlaceholder');
                if (placeholderElement) {
                    placeholderElement.style.display = 'none';
                }
            }
        }
    }
    
    editSelectedInstance() {
        // 直接调用带edit模式的showAddInstanceModal方法
        // 该方法内部会检查是否有选择实例并给出提示
        this.showAddInstanceModal('edit');
    }
    
    deleteSelectedInstance() {
        const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
        const instanceId = databaseInstanceSelect?.value;
        const instanceName = databaseInstanceSelect?.options[databaseInstanceSelect.selectedIndex]?.text;
        
        if (!instanceId) {
            alert('请先选择一个数据库实例');
            return;
        }
        
        if (confirm(`确定要删除数据库实例 "${instanceName}" 吗？`)) {
            // 这里可以实现删除实例的逻辑
            console.log(`删除实例: ${instanceId}`);
            // 重新加载实例列表
            this.loadInstances();
        }
    }
    
    refreshDashboard() {
        if (window.grafanaMonitor) {
            window.grafanaMonitor.refreshDashboard();
        }
    }
    
    openDashboardInNewWindow() {
        const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
        
        if (!databaseInstanceSelect?.value) {
            alert('请先选择一个数据库实例');
            return;
        }
        
        if (window.grafanaMonitor) {
            window.grafanaMonitor.openInNewWindow();
        }
    }
    
    toggleFullscreen() {
        const grafanaContainer = document.querySelector('.grafana-container');
        if (grafanaContainer) {
            if (!document.fullscreenElement) {
                grafanaContainer.requestFullscreen().catch(err => {
                    console.error(`无法进入全屏模式: ${err.message}`);
                });
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
        }
    }
    
    showAddInstanceModal(mode = 'add', instanceId = null) {
        const modal = document.getElementById('addInstanceModal');
        const modalContent = document.querySelector('#addInstanceModal .modal-content');
        
        // 检查是否有选择实例（对于编辑和删除模式）
        if ((mode === 'edit' || mode === 'delete') && !instanceId) {
            // 如果没有提供instanceId，从下拉框获取
            const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
            instanceId = databaseInstanceSelect?.value;
            
            if (!instanceId) {
                alert('请先选择一个数据库实例');
                return;
            }
        }
        
        // 根据实例选择状态控制模态框内容的显示
        const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
        const currentInstanceId = databaseInstanceSelect?.value;
        
        if (modalContent) {
            // 重要：如果没有选择实例，始终隐藏模态框内容
            // 无论是什么模式，只要下拉框没有选择实例，模态框内容都不应该显示
            if (!currentInstanceId) {
                modalContent.style.display = 'none';
            } else {
                modalContent.style.display = 'block';
            }
        }
        const modalHeader = modal?.querySelector('.modal-header h3');
        
        // 检查是否有选择实例（编辑和删除模式需要）
        if (mode === 'edit' || mode === 'delete') {
            const databaseInstanceSelect = document.getElementById('databaseInstanceSelect');
            const selectedInstanceId = instanceId || databaseInstanceSelect?.value;
            
            if (!selectedInstanceId) {
                // 显示提示信息
                alert('请先选择一个数据库实例');
                return;
            }
        }
        
        if (modal && modalContent) {
            // 设置模态框标题
            if (modalHeader) {
                modalHeader.textContent = mode === 'add' ? '添加数据库实例' : '编辑数据库实例';
            }
            
            // 如果是编辑模式，加载实例数据
            if (mode === 'edit' && instanceId) {
                this.loadInstanceForEdit(instanceId);
            } else {
                // 重置表单
                const instanceForm = document.getElementById('instanceForm');
                if (instanceForm) {
                    instanceForm.reset();
                }
            }
            
            // 显示模态框和内容
            modal.style.display = 'block';
            modalContent.style.display = 'block';
        }
    }
    
    async loadInstanceForEdit(instanceId) {
        // 这里可以实现根据实例ID加载实例数据到表单的逻辑
        console.log(`加载实例数据用于编辑: ${instanceId}`);
        // 模拟加载数据
        setTimeout(() => {
            const instanceName = document.getElementById('instanceName');
            const host = document.getElementById('host');
            const port = document.getElementById('port');
            
            if (instanceName && host && port) {
                // 模拟数据
                instanceName.value = `实例 ${instanceId}`;
                host.value = 'localhost';
                port.value = '3306';
            }
        }, 100);
    }

    async testConnection() {
        const instanceSelect = document.getElementById('instanceSelect');
        const instanceId = instanceSelect?.value;
        
        if (!instanceId) {
            Utils.showMessage('请先选择监控实例', 'warning');
            return;
        }

        try {
            const testConnectionBtn = document.getElementById('testConnectionBtn');
            if (testConnectionBtn) {
                testConnectionBtn.disabled = true;
                testConnectionBtn.innerHTML = '测试中...';
            }

            // 调用后端API测试连接
            const response = await Utils.apiRequest(`/visual-ops/api/monitoring/test-connection/${instanceId}`);

            if (response && response.code === 200 && response.data) {
                if (response.data.connected) {
                    Utils.showMessage(`连接成功: ${response.data.message || '实例可达'}`, 'success');
                } else {
                    Utils.showMessage(`连接失败: ${response.data.message || '实例不可达'}`, 'error');
                }
            } else {
                Utils.showMessage('测试连接失败: ' + (response?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('测试连接错误:', error);
            Utils.showMessage('测试连接时发生错误: ' + error.message, 'error');
        } finally {
            const testConnectionBtn = document.getElementById('testConnectionBtn');
            if (testConnectionBtn) {
                testConnectionBtn.disabled = false;
                testConnectionBtn.innerHTML = '测试连接';
            }
        }
    }

    stopMonitoring() {
        this.isMonitoring = false;

        const startMonitorBtn = document.getElementById('startMonitorBtn');
        const stopMonitorBtn = document.getElementById('stopMonitorBtn');
        const instanceSelect = document.getElementById('instanceSelect');

        if (startMonitorBtn) startMonitorBtn.disabled = false;
        if (stopMonitorBtn) stopMonitorBtn.disabled = true;
        if (instanceSelect) instanceSelect.disabled = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        // 重置显示数据
        this.resetDisplayData();

        Utils.showMessage('监控已停止', 'info');
    }

    resetDisplayData() {
        // 重置所有指标显示为默认值
        const metrics = ['uptime', 'connections', 'qps', 'tps', 'slowQueries', 'threadsRunning'];
        metrics.forEach(metric => {
            const element = document.getElementById(metric);
            if (element) {
                element.textContent = '--';
            }
        });

        // 重置状态指示器
        document.querySelectorAll('.metric-status').forEach(status => {
            status.className = 'metric-status status-unknown';
        });

        // 清空表格数据
        this.clearTableData();
    }

    clearTableData() {
        const tables = ['slowQueriesTable', 'activeQueriesTable', 'tableSpaceTable', 'alertsTable'];
        tables.forEach(tableId => {
            const tbody = document.getElementById(tableId);
            if (tbody) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center">暂无数据</td></tr>`;
            }
        });
    }

    restartMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
            setTimeout(() => this.startMonitoring(), 100);
        }
    }

    async fetchRealtimeData() {
        if (!this.currentInstanceId) return;

        try {
            // 从后端API获取实时数据（已修改为异步方法）
            const mockData = await this.generateMockRealtimeData();
            this.updateRealtimeMetrics(mockData);
            this.updateTableData(mockData);

        } catch (error) {
            console.error('获取实时数据失败:', error);
            if (error.message.includes('401')) {
                this.stopMonitoring();
            }
        }
    }

    // 从后端API获取实时数据库监控信息
    async generateMockRealtimeData() {
        try {
            // 使用apiRequest方法从后端获取实时数据
            const response = await Utils.apiRequest(`/visual-ops/api/monitoring/realtime-data/${this.currentInstanceId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 检查响应是否有效
            if (response && response.data) {
                // 格式化数据确保前端正常显示
                return this.formatMonitoringData(response.data);
            }

            throw new Error('无效的响应数据');
        } catch (error) {
            console.error('获取实时监控数据失败:', error);
            // 如果API请求失败，返回简化的模拟数据以保持界面功能
            return this.getFallbackMonitoringData();
        }
    }

    // 格式化监控数据
    formatMonitoringData(data) {
        // 确保返回的数据结构完整，即使某些字段缺失
        const formattedData = {
            uptime: data.uptime || 0,
            connections: data.connections || 0,
            qps: data.qps || 0,
            tps: data.tps || 0,
            slow_queries: data.slow_queries || 0,
            threads_running: data.threads_running || 0,
            slow_queries_list: Array.isArray(data.slow_queries_list) ? data.slow_queries_list : [],
            active_queries: Array.isArray(data.active_queries) ? data.active_queries : [],
            table_space: Array.isArray(data.table_space) ? data.table_space : [],
            timestamp: data.timestamp || Date.now()
        };

        return formattedData;
    }

    // 格式化运行时间
    formatUptime(seconds) {
        if (!seconds || seconds < 0) return '0s';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        result += `${remainingSeconds}s`;

        return result.trim();
    }

    // 格式化数字（处理字符串和数字类型）
    formatNumber(value) {
        if (typeof value === 'string') {
            return value;
        }
        return Number(value).toFixed(1);
    }

    // 获取降级的模拟数据
    getFallbackMonitoringData() {
        console.log('使用降级数据显示监控信息');
        return {
            uptime: 0,
            connections: 0,
            qps: 0,
            tps: 0,
            slow_queries: 0,
            threads_running: 0,
            slow_queries_list: [],
            active_queries: [],
            table_space: [],
            timestamp: Date.now()
        };
    }

    generateMockSlowQueries() {
        const queries = [
            "SELECT * FROM users WHERE created_at > '2024-01-01'",
            "SELECT COUNT(*) FROM orders WHERE status = 'pending'",
            "UPDATE products SET stock = stock - 1 WHERE id = 123",
            "SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id"
        ];

        return Array.from({ length: 3 }, (_, i) => ({
            query: queries[Math.floor(Math.random() * queries.length)],
            execution_time: (Math.random() * 5 + 1).toFixed(3),
            lock_time: (Math.random() * 0.1).toFixed(3),
            rows_sent: Math.floor(Math.random() * 1000),
            database: 'test_db',
            query_time: new Date(Date.now() - Math.random() * 3600000).toISOString()
        }));
    }

    generateMockActiveQueries() {
        const states = ['Sleep', 'Query', 'Locked', 'Sending data'];
        const queries = [
            "SELECT * FROM information_schema.tables",
            "SHOW PROCESSLIST",
            "SELECT COUNT(*) FROM users",
            "UPDATE sessions SET last_activity = NOW()"
        ];

        return Array.from({ length: 5 }, (_, i) => ({
            id: Math.floor(Math.random() * 1000),
            user: ['root', 'app_user', 'monitor_user'][Math.floor(Math.random() * 3)],
            host: 'localhost',
            db: 'test_db',
            state: states[Math.floor(Math.random() * states.length)],
            time: Math.floor(Math.random() * 10),
            info: queries[Math.floor(Math.random() * queries.length)]
        }));
    }

    generateMockTableSpace() {
        const tables = ['users', 'orders', 'products', 'logs', 'sessions'];

        return tables.map(table => ({
            table_name: table,
            engine: 'InnoDB',
            rows: Math.floor(Math.random() * 100000),
            data_size: Math.floor(Math.random() * 100000000),
            index_size: Math.floor(Math.random() * 50000000),
            total_size: Math.floor(Math.random() * 150000000),
            fragmentation: (Math.random() * 10).toFixed(1) + '%'
        }));
    }

    updateRealtimeMetrics(data) {
        // 更新指标卡片
        const metrics = {
            uptime: this.formatUptime(data.uptime),
            connections: data.connections !== undefined && data.connections !== null ? data.connections : '--',
            qps: data.qps !== undefined && data.qps !== null ? data.qps : '--',
            tps: data.tps !== undefined && data.tps !== null ? data.tps : '--',
            slowQueries: data.slow_queries !== undefined && data.slow_queries !== null ? data.slow_queries : '--',
            threadsRunning: data.threads_running !== undefined && data.threads_running !== null ? data.threads_running : '--'
        };

        Object.keys(metrics).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = metrics[key];
            }
        });

        // 更新状态指示器
        this.updateStatusIndicators(data);
    }

    formatUptime(seconds) {
        if (!seconds) return '--';

        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    updateStatusIndicators(data) {
        // 根据数据状态更新指标卡片的颜色状态
        const statusElements = document.querySelectorAll('.metric-status');

        // 简单逻辑：根据连接数和慢查询数量判断状态
        const connections = parseInt(data.connections) || 0;
        const slowQueries = parseInt(data.slow_queries) || 0;

        statusElements.forEach((status, index) => {
            let statusClass = 'status-normal';

            if (index === 1 && connections > 80) { // 连接数状态
                statusClass = 'status-critical';
            } else if (index === 4 && slowQueries > 5) { // 慢查询状态
                statusClass = 'status-warning';
            } else if (index === 0 && !data.uptime) { // 运行时间状态
                statusClass = 'status-unknown';
            }

            status.className = `metric-status ${statusClass}`;
        });
    }

    updateTableData(data) {
        // 更新慢查询表格
        if (data.slow_queries_list && Array.isArray(data.slow_queries_list)) {
            this.updateSlowQueriesTable(data.slow_queries_list);
        }

        // 更新活跃查询表格
        if (data.active_queries && Array.isArray(data.active_queries)) {
            this.updateActiveQueriesTable(data.active_queries);
        }

        // 更新表空间表格
        if (data.table_space && Array.isArray(data.table_space)) {
            this.updateTableSpaceTable(data.table_space);
        }
    }

    updateSlowQueriesTable(queries) {
        const tbody = document.getElementById('slowQueriesTable');

        if (queries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">暂无慢查询数据</td></tr>';
            return;
        }

        tbody.innerHTML = queries.map(query => `
            <tr>
                <td class="query-sql" title="${query.query}">${this.truncateText(query.query, 50)}</td>
                <td>${query.execution_time}s</td>
                <td>${query.lock_time}s</td>
                <td>${query.rows_sent}</td>
                <td>${query.database}</td>
                <td>${Utils.formatDate(query.query_time)}</td>
            </tr>
        `).join('');
    }

    updateActiveQueriesTable(queries) {
        const tbody = document.getElementById('activeQueriesTable');

        if (queries.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">暂无活跃查询数据</td></tr>';
            return;
        }

        tbody.innerHTML = queries.map(query => `
            <tr>
                <td>${query.id}</td>
                <td>${query.user}</td>
                <td>${query.host}</td>
                <td>${query.db}</td>
                <td><span class="status-badge status-${query.state.toLowerCase()}">${query.state}</span></td>
                <td>${query.time}s</td>
                <td class="query-sql" title="${query.info}">${this.truncateText(query.info, 30)}</td>
            </tr>
        `).join('');
    }

    updateTableSpaceTable(tables) {
        const tbody = document.getElementById('tableSpaceTable');

        if (tables.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">暂无表空间数据</td></tr>';
            return;
        }

        tbody.innerHTML = tables.map(table => `
            <tr>
                <td>${table.name}</td>
                <td>-</td>
                <td>-</td>
                <td>${this.formatSize(table.data_size || 0)}</td>
                <td>${this.formatSize(table.index_size || 0)}</td>
                <td>${this.formatSize(table.size || 0)}</td>
                <td>${table.percent_used || '-'}</td>
            </tr>
        `).join('');
    }

    async loadHistoryData() {
        if (!this.currentInstanceId) return;

        try {
            const timeRange = document.getElementById('timeRangeSelect').value;
            // 从API获取真实历史数据
            const response = await Utils.apiRequest(`/api/monitoring/history-data/${this.currentInstanceId}?timeRange=${timeRange}`, 'GET');

            // 如果响应不成功或没有数据，抛出错误
            if (!response.success || !response.data) {
                throw new Error('获取历史数据失败：' + (response.message || '未知错误'));
            }

            // 格式化历史数据以适应图表需求
            this.chartData = this.formatHistoryData(response.data);
            this.updateChart();
        } catch (error) {
            console.error('加载历史数据失败:', error);
            // 直接报错，不使用降级方案
            throw error;
        }
    }

    // 格式化从API获取的历史数据
    formatHistoryData(apiData) {
        // 确保数据结构符合图表需求
        const formattedData = {};
        const metrics = ['qps', 'tps', 'connections', 'slow_queries', 'threads_running'];

        metrics.forEach(metric => {
            if (apiData[metric] && Array.isArray(apiData[metric].values)) {
                formattedData[metric] = {
                    labels: apiData[metric].labels || [],
                    values: apiData[metric].values
                };
            } else {
                // 如果某个指标数据缺失，使用空数组
                formattedData[metric] = { labels: [], values: [] };
            }
        });

        return formattedData;
    }



    updateChart() {
        const chartContainer = document.getElementById('performanceChart');
        const metric = document.getElementById('chartMetricSelect').value;

        if (!this.chartData[metric]) {
            chartContainer.innerHTML = `
                <div class="chart-placeholder">
                    <p>暂无 ${metric.toUpperCase()} 历史数据</p>
                </div>
            `;
            return;
        }

        // 这里可以集成图表库，如 Chart.js 或 ECharts
        // 暂时使用简单的HTML模拟图表
        chartContainer.innerHTML = this.createSimpleChart(this.chartData[metric], metric);
    }

    createSimpleChart(data, metric) {
        const maxValue = Math.max(...data.values);
        const avgValue = data.values.reduce((a, b) => a + b, 0) / data.values.length;

        return `
            <div class="simple-chart">
                <div class="chart-header">
                    <h4>${metric.toUpperCase()} 趋势</h4>
                    <span>最大值: ${maxValue} | 平均值: ${avgValue.toFixed(2)}</span>
                </div>
                <div class="chart-bars">
                    ${data.values.map(value => `
                        <div class="chart-bar" style="height: ${(value / maxValue) * 80}%"
                             title="${value}"></div>
                    `).join('')}
                </div>
                <div class="chart-labels">
                    ${data.labels.map(label => `<span>${label}</span>`).join('')}
                </div>
            </div>
        `;
    }

    async testConnection() {
        if (!this.currentInstanceId) {
            Utils.showMessage('请先选择实例', 'warning');
            return;
        }

        try {
            Utils.setLoading(document.getElementById('testConnectionBtn'), true);

            // 模拟连接测试 - 实际项目中应该调用API
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 随机模拟成功或失败
            const success = Math.random() > 0.2;
            if (success) {
                Utils.showMessage('连接测试成功', 'success');
            } else {
                throw new Error('连接超时或认证失败');
            }

        } catch (error) {
            Utils.showMessage('连接测试失败: ' + error.message, 'error');
        } finally {
            Utils.setLoading(document.getElementById('testConnectionBtn'), false);
        }
    }

    showAddInstanceModal() {
        // 调用带参数的版本，使用默认的add模式
        this.showAddInstanceModal('add', null);
    }

    hideAddInstanceModal() {
        const modal = document.getElementById('addInstanceModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async testNewInstance() {
        try {
            const formData = this.getFormData();
            
            if (!formData.name || !formData.host || !formData.port) {
                Utils.showMessage('请填写完整的实例信息', 'warning');
                return;
            }

            const testInstanceBtn = document.getElementById('testInstanceBtn');
            if (testInstanceBtn) {
                testInstanceBtn.disabled = true;
                testInstanceBtn.innerHTML = '测试中...';
            }

            // 调用后端API测试新实例连接
            const response = await Utils.apiRequest('/visual-ops/api/monitoring/test-new-instance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response && response.code === 200 && response.data) {
                if (response.data.connected) {
                    Utils.showMessage(`连接成功: ${response.data.message || '实例可达'}`, 'success');
                } else {
                    Utils.showMessage(`连接失败: ${response.data.message || '实例不可达'}`, 'error');
                }
            } else {
                Utils.showMessage('测试连接失败: ' + (response?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('测试新实例错误:', error);
            Utils.showMessage('测试新实例连接时发生错误: ' + error.message, 'error');
        } finally {
            const testInstanceBtn = document.getElementById('testInstanceBtn');
            if (testInstanceBtn) {
                testInstanceBtn.disabled = false;
                testInstanceBtn.innerHTML = '测试连接';
            }
        }
    }

    async saveInstance() {
        try {
            const formData = this.getFormData();
            
            if (!formData.name || !formData.host || !formData.port) {
                Utils.showMessage('请填写完整的实例信息', 'warning');
                return;
            }

            const saveInstanceBtn = document.getElementById('saveInstanceBtn');
            if (saveInstanceBtn) {
                saveInstanceBtn.disabled = true;
                saveInstanceBtn.innerHTML = '保存中...';
            }

            // 调用后端API保存实例
            const response = await Utils.apiRequest('/visual-ops/api/monitoring/save-instance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response && response.code === 200) {
                Utils.showMessage('实例保存成功', 'success');
                this.hideAddInstanceModal();
                this.loadInstances();
            } else {
                Utils.showMessage('保存实例失败: ' + (response?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('保存实例错误:', error);
            Utils.showMessage('保存实例时发生错误: ' + error.message, 'error');
        } finally {
            const saveInstanceBtn = document.getElementById('saveInstanceBtn');
            if (saveInstanceBtn) {
                saveInstanceBtn.disabled = false;
                saveInstanceBtn.innerHTML = '保存';
            }
        }
    }

    getFormData() {
        const name = document.getElementById('instanceName')?.value;
        const host = document.getElementById('instanceHost')?.value;
        const port = document.getElementById('instancePort')?.value;
        const username = document.getElementById('instanceUsername')?.value;
        const password = document.getElementById('instancePassword')?.value;
        const description = document.getElementById('instanceDescription')?.value;
        // 添加Grafana URL字段
        const grafanaUrl = document.getElementById('instanceGrafanaUrl')?.value;

        return {
            name,
            host,
            port,
            username,
            password,
            description,
            grafanaUrl
        };
    }

    switchTab(button) {
        // 移除所有活跃状态
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // 设置新的活跃状态
        button.classList.add('active');
        const tabId = button.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    }

    refreshData() {
        this.loadInstances();
    }
}

// 初始化系统监控
let systemMonitor = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeUserInfo();
    bindPageEvents('system-monitoring');
    loadSystemMonitoringContent();

    // 初始化系统监控模块
    systemMonitor = new SystemMonitor();
    
    // 初始化Grafana监控系统（模拟）
    window.grafanaMonitor = {
        onInstanceChange: function(instanceId) {
            console.log(`切换到数据库实例: ${instanceId}`);
            // 模拟根据实例加载可用仪表盘
            const dashboardSelect = document.getElementById('dashboardSelect');
            if (dashboardSelect && instanceId) {
                // 清空现有选项
                dashboardSelect.innerHTML = '<option value="">请选择仪表盘...</option>';
                
                // 根据不同实例添加不同的仪表盘选项
                let dashboards = [];
                if (instanceId === 'instance1') {
                    dashboards = [
                        {id: 'db-overview', name: '数据库概览'},
                        {id: 'performance', name: '性能监控'},
                        {id: 'query-stats', name: '查询统计'}
                    ];
                } else if (instanceId === 'instance2') {
                    dashboards = [
                        {id: 'test-db-overview', name: '测试库概览'},
                        {id: 'test-performance', name: '测试性能监控'}
                    ];
                } else if (instanceId === 'instance3') {
                    dashboards = [
                        {id: 'pg-overview', name: 'PostgreSQL概览'},
                        {id: 'pg-stats', name: 'PostgreSQL统计'}
                    ];
                }
                
                // 添加仪表盘选项
                dashboards.forEach(dashboard => {
                    const option = document.createElement('option');
                    option.value = dashboard.id;
                    option.textContent = dashboard.name;
                    dashboardSelect.appendChild(option);
                });
            }
        },
        
        loadDashboard: function(dashboardId) {
            console.log(`加载仪表盘: ${dashboardId}`);
            const instanceId = document.getElementById('databaseInstanceSelect')?.value;
            
            if (instanceId && dashboardId) {
                // 准备iframe加载
                const grafanaError = document.getElementById('grafanaError');
                const grafanaIframe = document.getElementById('grafanaIframe');
                
                if (grafanaError && grafanaIframe) {
                    grafanaError.classList.add('hidden');
                    grafanaIframe.src = '';
                    
                    // 模拟加载延迟
                    setTimeout(() => {
                        // 设置真实的Grafana URL
                        grafanaIframe.src = 'http://111.229.175.130:3000/d/MQWgroiiz/mysql-overview?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9104&refresh=1m';
                        grafanaIframe.style.display = 'block';
                    }, 1000);
                }
            }
        },
        
        refreshDashboard: function() {
            const grafanaIframe = document.getElementById('grafanaIframe');
            if (grafanaIframe && grafanaIframe.src) {
                grafanaIframe.src = grafanaIframe.src;
            }
        },
        
        openInNewWindow: function() {
            const grafanaIframe = document.getElementById('grafanaIframe');
            if (grafanaIframe && grafanaIframe.src) {
                window.open(grafanaIframe.src, '_blank');
            }
        },
        
        setInstances: function(instances) {
            console.log('设置实例列表:', instances);
        }
    };
});

function initializeUserInfo() {
    // 获取用户信息并显示
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
        userInfoElement.textContent = sessionStorage.getItem('username') || 'Guest';
    }
}

function bindSystemMonitoringEvents() {
    // 系统监控页面特定事件绑定
    console.log('System monitoring events bound');
}

function loadSystemMonitoringContent() {
    // 加载系统监控页面内容
    console.log('System monitoring content loaded');
}

function bindPageEvents(pageName) {
    // 绑定页面通用事件
    console.log(`Binding events for page: ${pageName}`);
}