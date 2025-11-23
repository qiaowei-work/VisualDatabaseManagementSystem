/**
 * 服务器监控相关功能
 */

class ServerMonitoring {
    constructor() {
        this.grafanaUrl = 'http://111.229.175.130:3000/d/NodeExporterFullA/node-exporter-full?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9100&refresh=1m';
        this.grafanaIframe = null;
        this.fullscreenBtn = null;
        this.refreshDashboardBtn = null;
        this.openInGrafanaBtn = null;
        this.isFullscreen = false;
        
        // 性能监控相关属性
        this.loadStartTime = 0;
        this.loadEndTime = 0;
        this.isFromCache = false;
        this.cachedResourceName = 'grafana-server-dashboard';
    }

    /**
     * 初始化监控功能
     */
    init() {
        this.grafanaIframe = document.getElementById('grafanaIframe');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
        this.openInGrafanaBtn = document.getElementById('openInGrafanaBtn');
        
        // 检查是否有预加载的缓存
        this.checkPreloadCache();
        
        this.bindEvents();
        this.setupResponsiveLayout();
    }
    
    /**
     * 检查是否有预加载的缓存，并使用缓存加速加载
     */
    checkPreloadCache() {
        // 记录加载开始时间
        this.loadStartTime = performance.now();
        
        if (window.preloadService) {
            // 检查Grafana服务器仪表盘是否已预加载
            const isDashboardPreloaded = window.preloadService.isResourceCached(this.cachedResourceName);
            
            if (isDashboardPreloaded) {
                console.log('🔄 检测到预加载的Grafana仪表盘缓存，正在加速加载...');
                this.isFromCache = true;
                
                // 从localStorage中获取缓存的时间信息
                const cacheInfo = this.getCacheInfo();
                if (cacheInfo) {
                    console.log(`📊 缓存信息 - 创建时间: ${new Date(cacheInfo.createdAt).toLocaleString()}, 缓存时长: ${this.formatCacheAge(cacheInfo.createdAt)}`);
                }
                
                // 显示缓存使用提示
                this.showCacheNotification('正在使用预加载缓存...', 'success');
                
                // 添加加载完成的视觉反馈
                if (this.grafanaIframe) {
                    // 设置加载超时，确保即使缓存有问题也能正常加载
                    const loadTimeout = setTimeout(() => {
                        console.warn('⏱️ Grafana iframe加载超时，刷新iframe...');
                        this.grafanaIframe.src = this.grafanaIframe.src;
                    }, 5000);
                    
                    // 监听加载完成事件
                    this.grafanaIframe.onload = () => {
                        clearTimeout(loadTimeout);
                        this.loadEndTime = performance.now();
                        this.recordLoadTime();
                        console.log('✅ Grafana仪表盘从缓存加载完成');
                        
                        // 更新缓存信息
                        this.updateCacheInfo();
                    };
                    
                    // 如果iframe已经加载过但被缓存，触发一次重新加载以使用缓存
                    this.grafanaIframe.src = this.grafanaUrl;
                }
            } else {
                console.log('📝 未检测到预加载缓存，使用常规方式加载');
                
                // 正常加载情况下也记录性能
                if (this.grafanaIframe) {
                    this.grafanaIframe.onload = () => {
                        this.loadEndTime = performance.now();
                        this.recordLoadTime();
                        console.log('✅ Grafana仪表盘常规加载完成');
                    };
                }
            }
        } else {
            console.log('⚠️ 预加载服务不可用');
        }
    }
    
    /**
     * 显示缓存使用通知
     */
    showCacheNotification(message, type = 'info') {
        const container = document.getElementById('grafanaContainer');
        if (!container) return;
        
        // 创建通知元素
        let notification = document.getElementById('cacheNotification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'cacheNotification';
            notification.className = 'cache-notification';
            notification.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 10px 15px;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                z-index: 1001;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
            `;
            container.appendChild(notification);
        }
        
        // 设置通知样式和内容
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#2ecc71';
                break;
            case 'info':
                notification.style.backgroundColor = '#3498db';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f39c12';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                break;
        }
        
        notification.textContent = message;
        notification.style.display = 'block';
        
        // 3秒后隐藏通知
        setTimeout(() => {
            if (notification) {
                notification.style.display = 'none';
            }
        }, 3000);
    }
    
    /**
     * 记录并显示加载时间
     */
    recordLoadTime() {
        const loadTime = this.loadEndTime - this.loadStartTime;
        const loadType = this.isFromCache ? '缓存加载' : '常规加载';
        
        console.log(`⏱️ ${loadType}耗时: ${loadTime.toFixed(2)}ms`);
        
        // 显示加载时间通知
        this.showCacheNotification(`${loadType}完成! 耗时: ${loadTime.toFixed(2)}ms`, 'success');
        
        // 记录到性能分析日志
        this.logPerformanceData(loadType, loadTime);
    }
    
    /**
     * 记录性能数据
     */
    logPerformanceData(loadType, loadTime) {
        try {
            // 尝试记录到localStorage用于长期分析
            const perfData = JSON.parse(localStorage.getItem('grafana_performance_log') || '[]');
            perfData.push({
                timestamp: new Date().toISOString(),
                loadType: loadType,
                loadTime: loadTime,
                url: this.grafanaUrl
            });
            
            // 只保留最近100条记录
            if (perfData.length > 100) {
                perfData.splice(0, perfData.length - 100);
            }
            
            localStorage.setItem('grafana_performance_log', JSON.stringify(perfData));
        } catch (error) {
            console.error('记录性能数据失败:', error);
        }
    }
    
    /**
     * 获取缓存信息
     */
    getCacheInfo() {
        try {
            const cacheKey = `cache_info_${this.cachedResourceName}`;
            return JSON.parse(localStorage.getItem(cacheKey) || 'null');
        } catch (error) {
            console.error('获取缓存信息失败:', error);
            return null;
        }
    }
    
    /**
     * 更新缓存信息
     */
    updateCacheInfo() {
        try {
            const cacheKey = `cache_info_${this.cachedResourceName}`;
            const cacheInfo = {
                createdAt: new Date().getTime(),
                url: this.grafanaUrl,
                lastAccessed: new Date().getTime()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheInfo));
        } catch (error) {
            console.error('更新缓存信息失败:', error);
        }
    }
    
    /**
     * 格式化缓存时长
     */
    formatCacheAge(timestamp) {
        const now = new Date().getTime();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (minutes > 0) {
            return `${minutes}分钟${seconds}秒`;
        } else {
            return `${seconds}秒`;
        }
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 全屏按钮点击事件
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }

        // 刷新按钮点击事件
        if (this.refreshDashboardBtn) {
            this.refreshDashboardBtn.addEventListener('click', () => this.refreshDashboard());
        }

        // 在Grafana中打开按钮点击事件
        if (this.openInGrafanaBtn) {
            this.openInGrafanaBtn.addEventListener('click', () => this.openInGrafana());
        }

        // 监听窗口大小变化，调整iframe大小
        window.addEventListener('resize', () => this.adjustIframeSize());
    }

    /**
     * 设置响应式布局
     */
    setupResponsiveLayout() {
        // 初始调整iframe大小
        this.adjustIframeSize();
    }

    /**
     * 调整iframe大小以适应容器
     */
    adjustIframeSize() {
        if (!this.grafanaIframe) return;
        
        // 计算合适的高度，基于屏幕高度的一定比例
        const viewportHeight = window.innerHeight;
        // 留出顶部导航栏和控制面板的空间
        const iframeHeight = viewportHeight - 250;
        
        // 确保高度不会太小
        const minHeight = 600;
        const finalHeight = Math.max(iframeHeight, minHeight);
        
        this.grafanaIframe.style.height = `${finalHeight}px`;
    }

    /**
     * 切换全屏模式
     */
    toggleFullscreen() {
        if (!this.grafanaIframe) return;
        
        if (!this.isFullscreen) {
            // 进入全屏
            if (this.grafanaIframe.requestFullscreen) {
                this.grafanaIframe.requestFullscreen();
            } else if (this.grafanaIframe.mozRequestFullScreen) {
                this.grafanaIframe.mozRequestFullScreen();
            } else if (this.grafanaIframe.webkitRequestFullscreen) {
                this.grafanaIframe.webkitRequestFullscreen();
            } else if (this.grafanaIframe.msRequestFullscreen) {
                this.grafanaIframe.msRequestFullscreen();
            }
            this.isFullscreen = true;
        } else {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
        }
    }

    /**
     * 刷新仪表盘
     */
    refreshDashboard() {
        if (!this.grafanaIframe) return;
        
        // 重置加载状态
        this.loadStartTime = performance.now();
        this.isFromCache = false;
        
        // 刷新iframe
        this.grafanaIframe.src = this.grafanaUrl + (this.grafanaUrl.includes('?') ? '&' : '?') + 'refresh=' + new Date().getTime();
        
        // 重新设置加载完成事件
        this.grafanaIframe.onload = () => {
            this.loadEndTime = performance.now();
            this.recordLoadTime();
        };
    }

    /**
     * 在新标签页中打开Grafana
     */
    openInGrafana() {
        // 移除kiosk参数，以便在新标签页中显示完整的Grafana界面
        const fullGrafanaUrl = this.grafanaUrl.replace('&kiosk', '');
        window.open(fullGrafanaUrl, '_blank');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const serverMonitoring = new ServerMonitoring();
    serverMonitoring.init();
});