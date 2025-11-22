/**
 * Grafana嵌入监控系统的JavaScript逻辑
 * 处理实例管理、仪表盘切换和Grafana iframe嵌入
 */

// 模拟实例数据 - 实际应该从后端API获取
const MONITORING_INSTANCES = [
    {
        id: "mysql-prod-01",
        name: "生产数据库-主库",
        host: "111.229.175.130:3306",
        status: "online",
        grafanaBaseUrl: "http://111.229.175.130:3000",
        dashboards: [
            {name: "总览", url: "/d/MQWgroiiz/mysql-overview?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9104&refresh=1m"},
            {name: "性能", url: "/d/mysql-performance?var-instance=mysql-prod-01"},
            {name: "查询分析", url: "/d/mysql-queries?var-instance=mysql-prod-01"},
            {name: "存储", url: "/d/mysql-storage?var-instance=mysql-prod-01"}
        ]
    // },
    // {
    //     id: "mysql-prod-02",
    //     name: "生产数据库-从库",
    //     host: "192.168.1.101:3306",
    //     status: "online",
    //     grafanaBaseUrl: "http://111.229.175.130:3000",
    //     dashboards: [
    //         {name: "总览", url: "/d/MQWgroiiz/mysql-overview?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9104&refresh=1m"},
    //         {name: "性能", url: "/d/mysql-performance?var-instance=mysql-prod-02"},
    //         {name: "查询分析", url: "/d/mysql-queries?var-instance=mysql-prod-02"},
    //         {name: "存储", url: "/d/mysql-storage?var-instance=mysql-prod-02"}
    //     ]
    // },
    // {
    //     id: "mysql-test-01",
    //     name: "测试数据库",
    //     host: "192.168.1.200:3306",
    //     status: "offline",
    //     grafanaBaseUrl: "http://111.229.175.130:3000",
    //     dashboards: [
    //         {name: "总览", url: "/d/MQWgroiiz/mysql-overview?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9104&refresh=1m"},
    //         {name: "性能", url: "/d/mysql-performance?var-instance=mysql-test-01"},
    //         {name: "查询分析", url: "/d/mysql-queries?var-instance=mysql-test-01"},
    //         {name: "存储", url: "/d/mysql-storage?var-instance=mysql-test-01"}
    //     ]
     }
];

class GrafanaMonitoringSystem {
    constructor() {
        this.currentInstance = null;
        this.currentDashboard = null;
        this.grafanaIframe = null;
        this.isFullscreen = false;
        // 缓存相关属性
        this.cachedResources = new Set();
        this.loadedResources = new Map();
        this.preloadService = window.preloadService;
        
        this.init();
    }

    init() {
        // 确保在调用其他方法前，页面元素已加载
        this.loadInstances();
        this.bindEvents();
        this.updateUI();
        
        // 添加响应式处理
        this.handleResponsive();
        
        // 添加键盘快捷键支持
        this.addKeyboardShortcuts();
    }
    
    // 响应式处理
    handleResponsive() {
        const handleResize = () => {
            const width = window.innerWidth;
            const container = document.getElementById('grafanaContainer');
            
            if (container) {
                if (width <= 576) {
                    container.style.height = '400px';
                } else if (width <= 768) {
                    container.style.height = '500px';
                } else if (width <= 992) {
                    container.style.height = '650px';
                } else if (width <= 1200) {
                    container.style.height = '700px';
                } else {
                    container.style.height = '800px';
                }
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize(); // 初始化一次
    }
    
    // 添加键盘快捷键
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F 全屏
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const fullscreenBtn = document.getElementById('fullscreenBtn');
                if (fullscreenBtn && !fullscreenBtn.disabled) {
                    this.toggleFullscreen();
                }
            }
            
            // Ctrl/Cmd + R 刷新
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshDashboard();
            }
            
            // 数字键切换仪表盘功能已禁用，因为dashboardSelect已移除
        });
    }

    // 加载实例数据
    loadInstances() {
        const instanceSelect = document.getElementById('instanceSelect');
        if (!instanceSelect) return;
        
        instanceSelect.innerHTML = '<option value="">请选择数据库实例...</option>';

        MONITORING_INSTANCES.forEach(instance => {
            const option = document.createElement('option');
            option.value = instance.id;
            option.textContent = `${instance.name} (${instance.host})`;
            option.dataset.status = instance.status;
            
            // 添加状态指示器
            const statusSpan = document.createElement('span');
            statusSpan.className = `instance-status ${instance.status}`;
            option.prepend(statusSpan);
            
            instanceSelect.appendChild(option);
        });
        
        // 自动选择第一个在线实例
        const firstOnlineInstance = MONITORING_INSTANCES.find(i => i.status === 'online');
        if (firstOnlineInstance) {
            instanceSelect.value = firstOnlineInstance.id;
            this.onInstanceChange(firstOnlineInstance.id);
        }
    }

    // 绑定事件
    bindEvents() {
        const instanceSelect = document.getElementById('instanceSelect');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        const openInGrafanaBtn = document.getElementById('openInGrafanaBtn');

        if (instanceSelect) {
            instanceSelect.addEventListener('change', (e) => {
                this.onInstanceChange(e.target.value);
            });
        }

        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshDashboard());
        }

        if (openInGrafanaBtn) {
            openInGrafanaBtn.addEventListener('click', () => this.openInGrafana());
        }

        // 监听全屏变化事件
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }

    // 处理全屏变化
    handleFullscreenChange() {
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const container = document.getElementById('grafanaContainer');
        
        if (!container) return;
        
        const isFullscreen = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.mozFullScreenElement || 
                           document.msFullscreenElement;
        
        this.isFullscreen = !!isFullscreen;
        
        if (fullscreenBtn) {
            fullscreenBtn.textContent = this.isFullscreen ? '退出全屏' : '全屏';
        }
    }

    // 实例切换处理
    onInstanceChange(instanceId) {
        // 移除旧的仪表盘选择器内容
        // const dashboardSelect = document.getElementById('dashboardSelect');
        // if (dashboardSelect) {
        //     dashboardSelect.innerHTML = '';
        //     dashboardSelect.disabled = true;
        // }
        
        if (!instanceId) {
            this.currentInstance = null;
            this.currentDashboard = null;
            this.hideGrafana();
            return;
        }
        
        const instance = MONITORING_INSTANCES.find(i => i.id === instanceId);
        if (instance) {
            this.currentInstance = instance;
            // 自动选择第一个仪表盘
            if (instance.dashboards && instance.dashboards.length > 0) {
                this.currentDashboard = instance.dashboards[0];
                this.onDashboardChange(instance.dashboards[0].url);
            }
        }
    }

    // 仪表盘切换处理
    onDashboardChange(dashboardUrl) {
        if (!dashboardUrl || !this.currentInstance) return;
        
        this.currentDashboard = this.currentInstance.dashboards.find(d => d.url === dashboardUrl);
        if (this.currentDashboard) {
            this.showGrafana();
        }
    }

    // 检查资源是否已缓存
    isResourceCached(resourceUrl) {
        return this.cachedResources.has(resourceUrl) || 
               (this.preloadService && this.preloadService.isResourceCached(resourceUrl));
    }
    
    // 标记资源为已加载
    markResourceAsLoaded(resourceUrl) {
        this.cachedResources.add(resourceUrl);
        this.loadedResources.set(resourceUrl, new Date().getTime());
    }
    
    // 显示Grafana仪表盘
    showGrafana() {
        if (!this.currentInstance || !this.currentDashboard) return;
        
        const container = document.getElementById('grafanaContainer');
        const title = document.getElementById('grafanaTitle');
        
        // 安全地设置标题
        if (title) {
            title.textContent = `${this.currentInstance.name} - ${this.currentDashboard.name}`;
        }
        
        // 确保容器存在
        if (!container) return;
        
        // 移除旧的iframe
        if (this.grafanaIframe) {
            this.grafanaIframe.remove();
            this.grafanaIframe = null;
        }
        
        const dashboardUrl = this.currentInstance.grafanaBaseUrl + this.currentDashboard.url;
        const isCached = this.isResourceCached(dashboardUrl);
        
        // 创建新的iframe
        const iframe = document.createElement('iframe');
        iframe.src = dashboardUrl;
        iframe.className = 'grafana-iframe';
        iframe.frameBorder = '0';
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.allowFullscreen = true;
        
        // 如果资源已缓存，添加缓存提示
        if (isCached && window.Utils && typeof window.Utils.showToast === 'function') {
            window.Utils.showToast('从缓存加载仪表盘', 'success');
        }
        
        // 添加错误处理
        iframe.onload = () => {
            // 加载成功，标记资源为已加载
            this.markResourceAsLoaded(dashboardUrl);
        };
        
        iframe.onerror = () => {
            this.onGrafanaError();
        };
        
        container.appendChild(iframe);
        this.grafanaIframe = iframe;
        
        // 更新UI状态
        this.updateUI();
    }

    // 隐藏Grafana仪表盘
    hideGrafana() {
        const container = document.getElementById('grafanaContainer');
        const title = document.getElementById('grafanaTitle');
        
        // 安全地更新标题
        if (title) {
            title.textContent = '';
        }
        
        // 安全地清空容器
        if (container) {
            container.innerHTML = '';
        }
        
        this.grafanaIframe = null;
        this.updateUI();
    }

    // 处理Grafana错误
    onGrafanaError() {
        const container = document.getElementById('grafanaContainer');
        if (container) {
            container.innerHTML = `
                <div class="grafana-error">
                    <h3>仪表盘加载失败</h3>
                    <p>无法连接到Grafana服务或仪表盘不存在。</p>
                    <p>请检查网络连接或稍后重试。</p>
                </div>
            `;
        }
        
        // 安全地调用Utils.showToast
        if (window.Utils && typeof window.Utils.showToast === 'function') {
            window.Utils.showToast('仪表盘加载失败，请稍后重试', 'error');
        }
    }

    // 测试连接
    async testConnection() {
        // 获取Utils对象（安全检查）
        const utils = window.Utils;
        if (!utils || typeof utils.apiRequest !== 'function') {
            console.error('Utils对象或apiRequest方法不可用');
            return;
        }
        
        if (!this.currentInstance) {
            if (utils.showToast && typeof utils.showToast === 'function') {
                utils.showToast('请先选择实例', 'warning');
            }
            return;
        }
        
        // 安全地获取测试连接按钮
        const testConnectionBtn = document.getElementById('testConnectionBtn');
        if (testConnectionBtn) {
            testConnectionBtn.disabled = true;
            testConnectionBtn.textContent = '测试中...';
        }
        
        try {
            const response = await utils.apiRequest({
                url: `/api/monitoring/test-connection`,
                method: 'POST',
                data: {
                    instanceId: this.currentInstance.id,
                    host: this.currentInstance.host
                }
            });
            
            if (response.success) {
                this.updateInstanceStatus(this.currentInstance.id, 'online');
                if (utils.showToast && typeof utils.showToast === 'function') {
                    utils.showToast('连接成功', 'success');
                }
            } else {
                this.updateInstanceStatus(this.currentInstance.id, 'offline');
                if (utils.showToast && typeof utils.showToast === 'function') {
                    utils.showToast(`连接失败: ${response.message || '未知错误'}`, 'error');
                }
            }
        } catch (error) {
            console.error('测试连接失败:', error);
            this.updateInstanceStatus(this.currentInstance.id, 'offline');
            if (utils.showToast && typeof utils.showToast === 'function') {
                utils.showToast('连接失败，请检查网络或服务状态', 'error');
            }
        } finally {
            // 确保按钮状态恢复
            if (testConnectionBtn) {
                testConnectionBtn.disabled = false;
                testConnectionBtn.textContent = '测试连接';
            }
        }
    }

    // 更新实例状态
    updateInstanceStatus(instanceId, status) {
        const instance = MONITORING_INSTANCES.find(i => i.id === instanceId);
        if (instance) {
            instance.status = status;
            this.loadInstances();
            
            // 如果当前显示的是该实例，更新UI
            if (this.currentInstance && this.currentInstance.id === instanceId) {
                const instanceSelect = document.getElementById('instanceSelect');
                if (instanceSelect) {
                    instanceSelect.value = instanceId;
                    this.onInstanceChange(instanceId);
                }
            }
        }
    }

    // 刷新仪表盘
    refreshDashboard() {
        if (this.grafanaIframe) {
            this.grafanaIframe.src = this.grafanaIframe.src;
            // 安全地调用Utils.showToast
            if (window.Utils && typeof window.Utils.showToast === 'function') {
                window.Utils.showToast('仪表盘已刷新', 'info');
            }
        } else {
            // 安全地调用Utils.showToast
            if (window.Utils && typeof window.Utils.showToast === 'function') {
                window.Utils.showToast('请先选择实例和仪表盘', 'warning');
            }
        }
    }

    // 全屏切换
    toggleFullscreen() {
        const container = document.getElementById('grafanaContainer');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        
        if (!container) return;
        
        this.isFullscreen = !this.isFullscreen;

        if (this.isFullscreen) {
            container.classList.add('fullscreen');
            if (fullscreenBtn) {
                fullscreenBtn.textContent = '退出全屏';
            }
            
            // 尝试进入全屏模式
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else if (container.mozRequestFullScreen) {
                container.mozRequestFullScreen();
            } else if (container.msRequestFullscreen) {
                container.msRequestFullscreen();
            }
        } else {
            container.classList.remove('fullscreen');
            if (fullscreenBtn) {
                fullscreenBtn.textContent = '全屏';
            }
            
            // 退出全屏模式
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    // 在Grafana中打开
    openInGrafana() {
        if (this.currentInstance && this.currentDashboard) {
            const url = this.currentInstance.grafanaBaseUrl + this.currentDashboard.url;
            window.open(url, '_blank');
        } else {
            // 安全地调用Utils.showToast
            if (window.Utils && typeof window.Utils.showToast === 'function') {
                window.Utils.showToast('请先选择实例和仪表盘', 'warning');
            }
        }
    }

    // 更新UI状态
    updateUI() {
        const hasInstance = this.currentInstance !== null;
        const hasDashboard = this.currentDashboard !== null;
        
        // 安全地更新按钮状态，先检查元素是否存在
        const refreshBtn = document.getElementById('refreshDashboardBtn');
        if (refreshBtn) refreshBtn.disabled = !hasDashboard;
        
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) fullscreenBtn.disabled = !hasDashboard;
        
        const openBtn = document.getElementById('openInGrafanaBtn');
        if (openBtn) openBtn.disabled = !hasDashboard;
    }
}

// 页面加载完成后初始化监控系统
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否有容器元素再初始化
    if (document.getElementById('grafanaContainer')) {
        const monitoringSystem = new GrafanaMonitoringSystem();
        
        // 将监控系统实例挂载到window对象，方便外部访问
        window.grafanaMonitoring = monitoringSystem;
    }
});

// 预加载Grafana资源函数
window.preloadGrafanaResources = function() {
    // 确保预加载服务存在
    if (window.preloadService && typeof window.preloadService.startPreloading === 'function') {
        window.preloadService.startPreloading();
    }
};

// 外部API：允许直接加载指定的仪表盘
window.loadGrafanaDashboard = function(instanceId, dashboardUrl) {
    if (window.grafanaMonitoring) {
        window.grafanaMonitoring.onInstanceChange(instanceId);
        
        // 延迟执行仪表盘切换，确保实例已加载
        setTimeout(() => {
            window.grafanaMonitoring.onDashboardChange(dashboardUrl);
        }, 100);
    } else {
        console.warn('Grafana监控系统尚未初始化');
    }
};