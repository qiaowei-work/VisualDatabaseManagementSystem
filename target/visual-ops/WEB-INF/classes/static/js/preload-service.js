/**
 * 页面预加载服务
 * 在用户登录时异步加载常用页面内容并缓存，以加快后续访问速度
 */
class PagePreloadService {
    constructor() {
        this.cacheKeyPrefix = 'page_cache_';
        // 基础预加载URLs
        this.basePreloadUrls = [
            // 预加载server-monitoring.html页面
            {
                id: 'server-monitoring',
                url: '/server-monitoring',
                type: 'html'
            },
            // 预加载Grafana监控iframe内容
            {
                id: 'grafana-server-dashboard',
                url: 'http://111.229.175.130:3000/d/NodeExporterFullA/node-exporter-full?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9100&refresh=1m',
                type: 'iframe',
                priority: 'high'
            },
            // 预加载MySQL监控仪表盘
            {
                id: 'grafana-mysql-dashboard',
                url: 'http://111.229.175.130:3000/d/MQWgroiiz/mysql-overview?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9104&refresh=1m',
                type: 'iframe',
                priority: 'high'
            }
        ];
        
        // Grafana实例的预定义仪表盘列表
        this.grafanaInstances = [
            {
                baseUrl: 'http://111.229.175.130:3000',
                dashboards: [
                    {
                        id: 'mysql-overview',
                        url: '/d/MQWgroiiz/mysql-overview?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9104&refresh=1m',
                        priority: 'medium'
                    },
                    {
                        id: 'node-exporter',
                        url: '/d/NodeExporterFullA/node-exporter-full?orgId=1&kiosk&from=now-12h&to=now&var-host=localhost:9100&refresh=1m',
                        priority: 'medium'
                    },
                    {
                        id: 'mysql-performance',
                        url: '/d/mysql-performance?var-instance=mysql-prod-01',
                        priority: 'low'
                    },
                    {
                        id: 'mysql-queries',
                        url: '/d/mysql-queries?var-instance=mysql-prod-01',
                        priority: 'low'
                    },
                    {
                        id: 'mysql-storage',
                        url: '/d/mysql-storage?var-instance=mysql-prod-01',
                        priority: 'low'
                    }
                ]
            }
        ];
        
        // 资源加载状态缓存
        this.resourceStatus = new Map();
        
        // 浏览器缓存预热的资源列表
        this.warmupResources = [];
    }
    
    /**
     * 获取完整的预加载URL列表，包括基础URL和所有Grafana仪表盘
     */
    getPreloadUrls(priorityLevel = null) {
        let urls = [...this.basePreloadUrls];
        
        // 添加所有Grafana仪表盘
        this.grafanaInstances.forEach(instance => {
            instance.dashboards.forEach(dashboard => {
                urls.push({
                    id: `grafana-${dashboard.id}`,
                    url: instance.baseUrl + dashboard.url,
                    type: 'iframe',
                    priority: dashboard.priority
                });
            });
        });
        
        // 如果指定了优先级级别，则只返回该优先级的资源
        if (priorityLevel) {
            urls = urls.filter(url => url.priority === priorityLevel);
        }
        
        return urls;
    }

    /**
     * 开始预加载资源
     * @param {string|null} priorityLevel - 指定预加载的优先级：'high', 'medium', 'low'，为null时加载所有
     * @returns {Promise<Array>} 包含所有预加载结果的Promise数组
     */
    startPreloading(priorityLevel = null) {
        console.log(`开始预加载页面资源 (优先级: ${priorityLevel || 'all'})...`);
        
        // 检查浏览器是否支持localStorage
        if (!this.isLocalStorageSupported()) {
            console.warn('浏览器不支持localStorage，无法进行页面缓存');
            return Promise.resolve([]);
        }

        // 获取要预加载的URL列表
        const urlsToPreload = this.getPreloadUrls(priorityLevel);
        
        // 创建预加载任务数组
        const preloadPromises = urlsToPreload.map(urlConfig => {
            // 如果资源正在加载中，则返回已存在的Promise
            if (this.resourceStatus.has(urlConfig.id) && this.resourceStatus.get(urlConfig.id).status === 'loading') {
                console.log(`资源已在预加载中: ${urlConfig.id}`);
                return this.resourceStatus.get(urlConfig.id).promise;
            }
            
            // 创建新的预加载Promise
            const promise = this.preloadResource(urlConfig)
                .then(() => {
                    console.log(`资源预加载完成: ${urlConfig.id}`);
                    this.resourceStatus.set(urlConfig.id, { status: 'loaded', timestamp: Date.now() });
                })
                .catch(error => {
                    console.error(`资源预加载失败: ${urlConfig.id}`, error);
                    this.resourceStatus.set(urlConfig.id, { status: 'failed', timestamp: Date.now(), error });
                });
            
            // 记录加载状态
            this.resourceStatus.set(urlConfig.id, { status: 'loading', promise });
            
            return promise;
        });

        // 等待所有预加载任务完成或失败
        return Promise.allSettled(preloadPromises);
    }

    /**
     * 预加载单个资源
     * @param {Object} config - 资源配置
     * @returns {Promise} 预加载Promise
     */
    preloadResource(config) {
        return new Promise((resolve, reject) => {
            // 检查资源是否已经在缓存中
            if (this.isResourceCached(config.id)) {
                console.log(`资源已在缓存中: ${config.id}`);
                resolve();
                return;
            }

            try {
                if (config.type === 'html') {
                    // 预加载HTML页面
                    this.preloadHtml(config.url, config.id)
                        .then(resolve)
                        .catch(reject);
                } else if (config.type === 'iframe') {
                    // 预加载iframe内容
                    this.preloadIframeContent(config.url, config.id)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error(`不支持的资源类型: ${config.type}`));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * 预加载HTML页面
     * @param {string} url - 页面URL
     * @param {string} cacheId - 缓存ID
     * @returns {Promise} 预加载Promise
     */
    preloadHtml(url, cacheId) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP错误! 状态码: ${response.status}`);
                    }
                    return response.text();
                })
                .then(htmlContent => {
                    // 存储页面内容到localStorage
                    this.cacheResource(cacheId, htmlContent);
                    resolve();
                })
                .catch(error => {
                    console.error(`预加载HTML失败: ${url}`, error);
                    // 失败不阻止继续，返回成功以便不影响整体流程
                    resolve();
                });
        });
    }

    /**
     * 预加载iframe内容（使用隐藏iframe方式）
     * @param {string} url - iframe URL
     * @param {string} cacheId - 缓存ID
     * @returns {Promise} 预加载Promise
     */
    preloadIframeContent(url, cacheId) {
        return new Promise((resolve) => {
            // 检查资源是否已经在缓存中且未过期
            if (this.isResourceCached(cacheId)) {
                console.log(`Grafana资源已在缓存中: ${cacheId}`);
                resolve();
                return;
            }
            
            // 使用Image预加载一些关键资源
            this.preloadCriticalResources(url);
            
            // 创建隐藏的iframe来预加载内容
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.display = 'none';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            
            // 设置合适的sandbox属性以允许跨域资源加载
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms';
            
            // 使用预连接和预加载提示
            this.preconnectToDomain(url);
            
            // 设置iframe源
            iframe.src = url;

            // 设置超时（20秒）
            const timeout = setTimeout(() => {
                console.warn(`iframe预加载超时: ${url}`);
                // 清理iframe
                this.cleanupIframe(iframe);
                // 即使超时也缓存尝试过的状态
                this.cacheResource(cacheId, 'timeout_attempted');
                resolve();
            }, 20000);

            // 加载完成或出错时的处理
            iframe.onload = () => {
                clearTimeout(timeout);
                console.log(`iframe内容预加载完成: ${url}`);
                
                // 缓存预加载状态
                this.cacheResource(cacheId, {
                    status: 'preloaded',
                    timestamp: Date.now(),
                    url: url
                });
                
                // 延迟移除iframe，确保内容已被浏览器缓存
                setTimeout(() => {
                    this.cleanupIframe(iframe);
                }, 2000);
                
                resolve();
            };

            iframe.onerror = () => {
                clearTimeout(timeout);
                console.error(`iframe加载失败: ${url}`);
                this.cleanupIframe(iframe);
                // 缓存失败状态，但仍返回成功以避免阻塞其他预加载
                this.cacheResource(cacheId, {
                    status: 'failed',
                    timestamp: Date.now()
                });
                resolve();
            };

            // 添加到文档
            try {
                document.body.appendChild(iframe);
            } catch (error) {
                console.error('无法添加iframe到文档:', error);
                clearTimeout(timeout);
                resolve();
            }
        });
    }
    
    /**
     * 清理iframe元素
     * @param {HTMLIFrameElement} iframe - 要清理的iframe元素
     */
    cleanupIframe(iframe) {
        if (!iframe) return;
        
        try {
            // 先移除事件监听器
            iframe.onload = null;
            iframe.onerror = null;
            
            // 然后移除元素
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        } catch (error) {
            console.error('清理iframe失败:', error);
        }
    }
    
    /**
     * 预加载关键资源
     * @param {string} url - 要预加载的URL
     */
    preloadCriticalResources(url) {
        try {
            const urlObj = new URL(url);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            
            // 预加载可能的关键JavaScript和CSS资源
            const criticalResources = [
                `${baseUrl}/public/build/grafana.dark.css`,
                `${baseUrl}/public/build/main.12345.js`
            ];
            
            criticalResources.forEach(resourceUrl => {
                // 为CSS使用preload
                if (resourceUrl.endsWith('.css')) {
                    const link = document.createElement('link');
                    link.rel = 'preload';
                    link.as = 'style';
                    link.href = resourceUrl;
                    link.onload = () => link.onload = null;
                    link.onerror = () => link.onerror = null;
                    document.head.appendChild(link);
                    // 短暂延迟后移除，避免影响页面
                    setTimeout(() => {
                        if (link.parentNode) link.parentNode.removeChild(link);
                    }, 5000);
                }
                // 为图片使用Image预加载
                else if (resourceUrl.match(/\.(png|jpg|jpeg|svg|gif)$/)) {
                    const img = new Image();
                    img.src = resourceUrl;
                    img.onload = img.onerror = null;
                }
            });
        } catch (error) {
            console.error('预加载关键资源失败:', error);
        }
    }
    
    /**
     * 预连接到域名
     * @param {string} url - 要预连接的URL
     */
    preconnectToDomain(url) {
        try {
            const urlObj = new URL(url);
            const origin = `${urlObj.protocol}//${urlObj.host}`;
            
            // 创建preconnect链接
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = origin;
            document.head.appendChild(link);
            
            // 创建dns-prefetch链接作为回退
            const dnsLink = document.createElement('link');
            dnsLink.rel = 'dns-prefetch';
            dnsLink.href = origin;
            document.head.appendChild(dnsLink);
            
            // 短暂延迟后移除，避免过多的预连接占用资源
            setTimeout(() => {
                if (link.parentNode) link.parentNode.removeChild(link);
                if (dnsLink.parentNode) dnsLink.parentNode.removeChild(dnsLink);
            }, 10000);
        } catch (error) {
            console.error('预连接到域名失败:', error);
        }
    }

    /**
     * 缓存资源到localStorage
     * @param {string} id - 缓存ID
     * @param {any} content - 要缓存的内容
     */
    cacheResource(id, content) {
        try {
            const cacheData = {
                content: content,
                timestamp: Date.now()
            };
            
            // 尝试存储到localStorage
            try {
                localStorage.setItem(this.cacheKeyPrefix + id, JSON.stringify(cacheData));
                console.log(`资源已缓存: ${id}`);
            } catch (storageError) {
                // 如果localStorage已满或其他错误，尝试清理旧缓存
                if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.warn('localStorage空间已满，尝试清理旧缓存...');
                    this.cleanupOldCache();
                    // 再次尝试存储
                    try {
                        localStorage.setItem(this.cacheKeyPrefix + id, JSON.stringify(cacheData));
                        console.log(`资源已缓存（清理空间后）: ${id}`);
                    } catch (retryError) {
                        console.error(`缓存资源失败（即使在清理后）: ${id}`, retryError);
                    }
                } else {
                    throw storageError;
                }
            }
        } catch (error) {
            console.error(`缓存资源失败: ${id}`, error);
        }
    }
    
    /**
     * 清理旧缓存以释放空间
     */
    cleanupOldCache() {
        try {
            const cacheItems = [];
            
            // 收集所有缓存项
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cacheKeyPrefix)) {
                    try {
                        const item = JSON.parse(localStorage.getItem(key));
                        cacheItems.push({ key, timestamp: item.timestamp });
                    } catch (e) {
                        // 如果解析失败，视为旧缓存并删除
                        localStorage.removeItem(key);
                    }
                }
            }
            
            // 按时间戳排序，删除最旧的50%缓存
            cacheItems.sort((a, b) => a.timestamp - b.timestamp);
            const itemsToDelete = Math.floor(cacheItems.length * 0.5);
            
            for (let i = 0; i < itemsToDelete; i++) {
                localStorage.removeItem(cacheItems[i].key);
                console.log(`已删除旧缓存: ${cacheItems[i].key}`);
            }
        } catch (error) {
            console.error('清理旧缓存失败:', error);
        }
    }

    /**
     * 检查资源是否已缓存
     * @param {string} id - 缓存ID
     * @returns {boolean} 是否已缓存
     */
    isResourceCached(id) {
        try {
            const cachedData = localStorage.getItem(this.cacheKeyPrefix + id);
            if (!cachedData) return false;

            const data = JSON.parse(cachedData);
            // 检查缓存是否过期（24小时）
            const cacheAge = Date.now() - data.timestamp;
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24小时
            
            return cacheAge < maxCacheAge;
        } catch (error) {
            console.error(`检查缓存失败: ${id}`, error);
            return false;
        }
    }

    /**
     * 获取缓存的资源
     * @param {string} id - 缓存ID
     * @returns {string|null} 缓存的内容或null
     */
    getCachedResource(id) {
        try {
            const cachedData = localStorage.getItem(this.cacheKeyPrefix + id);
            if (!cachedData) return null;

            const data = JSON.parse(cachedData);
            return data.content;
        } catch (error) {
            console.error(`获取缓存失败: ${id}`, error);
            return null;
        }
    }

    /**
     * 清除缓存
     * @param {string} id - 可选，指定要清除的缓存ID
     */
    clearCache(id = null) {
        try {
            if (id) {
                // 清除特定缓存
                localStorage.removeItem(this.cacheKeyPrefix + id);
                console.log(`已清除缓存: ${id}`);
            } else {
                // 清除所有页面缓存
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(this.cacheKeyPrefix)) {
                        localStorage.removeItem(key);
                    }
                });
                console.log('已清除所有页面缓存');
            }
        } catch (error) {
            console.error('清除缓存失败', error);
        }
    }

    /**
     * 检查浏览器是否支持localStorage
     * @returns {boolean} 是否支持
     */
    isLocalStorageSupported() {
        try {
            const testKey = '__localStorage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
}

// 导出服务实例
const preloadService = new PagePreloadService();

// 使服务在全局可用，便于其他模块调用
window.preloadService = preloadService;

// 导出服务，支持模块导入
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = preloadService;
}
