package org.example.controller;

import org.example.dto.ApiResponseDTO;
import org.example.entity.DatabaseInstance;
import org.example.service.DatabaseInstanceService;
import org.example.service.DatabaseMonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 系统监控控制器
 */
@RestController
@RequestMapping("/api/monitoring")
public class SystemMonitoringController {
    
    private static final Logger logger = LoggerFactory.getLogger(SystemMonitoringController.class);
    
    @Autowired
    private DatabaseInstanceService databaseInstanceService;
    
    @Autowired
    private DatabaseMonitoringService databaseMonitoringService;
    
    /**
     * 获取监控实例列表
     */
    @GetMapping("/instances")
    public ApiResponseDTO<List<DatabaseInstance>> getMonitoringInstances() {
        try {
            logger.info("获取监控实例列表");
            List<DatabaseInstance> instances = databaseInstanceService.getAllInstances();
            return ApiResponseDTO.success(instances);
        } catch (Exception e) {
            logger.error("获取监控实例列表失败", e);
            return ApiResponseDTO.serverError("获取实例列表失败：" + e.getMessage());
        }
    }
    
    @GetMapping("/test-connection")
    public ApiResponseDTO<String> testConnection() {
        try {
            // 测试数据库连接是否正常
            List<DatabaseInstance> instances = databaseInstanceService.getAllInstances();
            return ApiResponseDTO.success("数据库连接正常，发现 " + instances.size() + " 个数据库实例");
        } catch (Exception e) {
            logger.error("测试数据库连接失败", e);
            return ApiResponseDTO.serverError("数据库连接失败: " + e.getMessage());
        }
    }
    
    /**
     * 开始监控
     */
    @PostMapping("/start")
    public ApiResponseDTO<Map<String, Object>> startMonitoring(@RequestBody Map<String, String> request) {
        try {
            String instanceId = request.get("instanceId");
            if (instanceId == null || instanceId.isEmpty()) {
                return ApiResponseDTO.paramError("实例ID不能为空");
            }
            
            logger.info("开始监控实例：{}", instanceId);
            
            // 验证实例是否存在
            DatabaseInstance instance = databaseInstanceService.getInstanceById(Long.valueOf(instanceId));
            if (instance == null || instance.getStatus() != 1) {
                return ApiResponseDTO.fail(404, "实例不存在或已禁用");
            }
            
            // 测试连接
            boolean connected = databaseInstanceService.testConnection(instance);
            if (!connected) {
                return ApiResponseDTO.fail(500, "无法连接到数据库实例");
            }
            
            // 生成初始监控数据
            Map<String, Object> monitoringData = databaseMonitoringService.getComprehensiveMonitoringData(instance);
            monitoringData.put("instanceName", instance.getName());
            
            logger.info("监控启动成功：{}", instance.getName());
            return ApiResponseDTO.success(monitoringData);
        } catch (NumberFormatException e) {
            return ApiResponseDTO.paramError("无效的实例ID格式");
        } catch (Exception e) {
            logger.error("开始监控失败", e);
            return ApiResponseDTO.serverError("启动监控失败：" + e.getMessage());
        }
    }
    
    /**
     * 停止监控
     */
    @PostMapping("/stop")
    public ApiResponseDTO<Map<String, Object>> stopMonitoring(@RequestBody Map<String, String> request) {
        try {
            String instanceId = request.get("instanceId");
            if (instanceId == null || instanceId.isEmpty()) {
                return ApiResponseDTO.paramError("实例ID不能为空");
            }
            
            logger.info("停止监控实例：{}", instanceId);
            
            // 这里可以添加实际的停止监控逻辑，如清理线程池等
            // 目前简单返回成功
            Map<String, Object> result = new HashMap<>();
            result.put("stopped", true);
//            result.put("message", "监控已停止");
            
            return ApiResponseDTO.success(result);
        } catch (Exception e) {
            logger.error("停止监控失败", e);
            return ApiResponseDTO.serverError("停止监控失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取实时监控数据
     */
    @GetMapping("/realtime-data/{instanceId}")
    public ApiResponseDTO<Map<String, Object>> getRealtimeData(@PathVariable String instanceId) {
        try {
            logger.info("获取实例 {} 的实时监控数据", instanceId);
            
            // 获取数据库实例信息
            DatabaseInstance instance = databaseInstanceService.getInstanceById(Long.valueOf(instanceId));
            if (instance == null) {
                return ApiResponseDTO.fail(404, "数据库实例不存在");
            }
            
            // 从实际数据库获取实时监控数据
            Map<String, Object> data = getRealDatabaseMonitoringData(instance);
            
             return ApiResponseDTO.success(data);
        } catch (NumberFormatException e) {
            return ApiResponseDTO.paramError("无效的实例ID格式");
        } catch (Exception e) {
            logger.error("获取实时监控数据失败", e);
            return ApiResponseDTO.serverError("获取监控数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 获取历史监控数据
     */
    @GetMapping("/history-data/{instanceId}")
    public ApiResponseDTO<Map<String, Object>> getHistoryData(@PathVariable String instanceId, @RequestParam(defaultValue = "24h") String timeRange) {
        try {
            logger.info("获取实例 {} 的历史监控数据，时间范围：{}", instanceId, timeRange);
            
            // 获取数据库实例信息
            DatabaseInstance instance = databaseInstanceService.getInstanceById(Long.valueOf(instanceId));
            if (instance == null) {
                return ApiResponseDTO.fail(404, "数据库实例不存在");
            }
            
            // 获取历史监控数据
            Map<String, Object> historyData = getRealDatabaseHistoryData(instance, timeRange);
            
            return ApiResponseDTO.success(historyData);
        } catch (NumberFormatException e) {
            return ApiResponseDTO.paramError("无效的实例ID格式");
        } catch (Exception e) {
            logger.error("获取历史监控数据失败", e);
            return ApiResponseDTO.serverError("获取历史数据失败：" + e.getMessage());
        }
    }
    
    /**
     * 从实际数据库获取监控数据
     */
    private Map<String, Object> getRealDatabaseMonitoringData(DatabaseInstance instance) {
        Map<String, Object> data = new HashMap<>();
        
        try {
            // 使用真实的监控服务获取数据
            data = databaseMonitoringService.getComprehensiveMonitoringData(instance);
            logger.info("成功获取数据库 {} 的实时监控数据", instance.getName());
            
        } catch (Exception e) {
            logger.error("获取实时监控数据失败，使用模拟数据: {}", e.getMessage());
//            // 如果获取实际数据失败，使用模拟数据
//            data = getMockDatabaseMonitoringData(instance);
        }
        
        return data;
    }
    
    /**
     * 从实际数据库获取历史监控数据
     */
    private Map<String, Object> getRealDatabaseHistoryData(DatabaseInstance instance, String timeRange) {
        Map<String, Object> historyData = new HashMap<>();
        
        try {
            // 在实际项目中，这里应该调用service层方法从数据库或时间序列数据库中获取历史数据
            // 目前使用模拟数据生成逻辑
            historyData = generateMockHistoryData(timeRange);
            
        } catch (Exception e) {
            logger.warn("从数据库获取历史数据失败，使用模拟数据: {}", e.getMessage());
            // 如果获取实际数据失败，使用模拟数据
            historyData = generateMockHistoryData(timeRange);
        }
        
        return historyData;
    }
    
    /**
     * 生成模拟历史数据
     */
    private Map<String, Object> generateMockHistoryData(String timeRange) {
        Map<String, Object> historyData = new HashMap<>();
        int dataPoints = 24; // 默认24个数据点
        
        // 根据时间范围确定数据点数量和间隔
        switch (timeRange) {
            case "1h": dataPoints = 12; break;  // 5分钟间隔
            case "6h": dataPoints = 18; break;  // 20分钟间隔
            case "24h": dataPoints = 24; break; // 1小时间隔
            case "7d": dataPoints = 28; break;  // 6小时间隔
        }
        
        // 生成各种指标的历史数据
        String[] metrics = {"qps", "tps", "connections", "slow_queries", "threads_running"};
        Random random = new Random();
        long now = System.currentTimeMillis();
        
        for (String metric : metrics) {
            Map<String, List<Object>> metricData = new HashMap<>();
            List<Object> values = new ArrayList<>();
            List<Object> labels = new ArrayList<>();
            
            // 为每个数据点生成值和标签
            for (int i = 0; i < dataPoints; i++) {
                // 根据指标类型生成不同范围的随机值
                int value = 0;
                switch (metric) {
                    case "qps": value = random.nextInt(500) + 50; break;
                    case "tps": value = random.nextInt(100) + 10; break;
                    case "connections": value = random.nextInt(80) + 20; break;
                    case "slow_queries": value = random.nextInt(8); break;
                    case "threads_running": value = random.nextInt(15) + 5; break;
                }
                
                values.add(value);
                
                // 生成时间标签
                long timestamp = now - (dataPoints - i - 1) * getTimeIntervalMillis(timeRange, dataPoints);
                Date date = new java.util.Date(timestamp);
                // 格式化为 HH:mm 格式
                labels.add(String.format("%02d:%02d", date.getHours(), date.getMinutes()));
            }
            
            metricData.put("values", values);
            metricData.put("labels", labels);
            historyData.put(metric, metricData);
        }
        
        return historyData;
    }
    
    /**
     * 获取时间间隔（毫秒）
     */
    private long getTimeIntervalMillis(String timeRange, int dataPoints) {
        switch (timeRange) {
            case "1h": return 5 * 60 * 1000L; // 5分钟
            case "6h": return 20 * 60 * 1000L; // 20分钟
            case "24h": return 60 * 60 * 1000L; // 1小时
            case "7d": return 6 * 60 * 60 * 1000L; // 6小时
            default: return 60 * 60 * 1000L; // 默认1小时
        }
    }
    
    /**
     * 模拟数据库状态数据
     */
    private Map<String, Object> getMockDatabaseStatus(DatabaseInstance instance) {
        Map<String, Object> status = new HashMap<>();
        Random random = new Random();
        
        status.put("uptime", (long)(random.nextInt(30 * 24 * 60 * 60) + 24 * 60 * 60)); // 1天到31天
        status.put("connections", random.nextInt(200) + 10);
        status.put("qps", (double)Math.round((random.nextDouble() * 500 + 50) * 10) / 10);
        status.put("tps", (double)Math.round((random.nextDouble() * 100 + 10) * 10) / 10);
        status.put("slow_queries", random.nextInt(20));
        status.put("threads_running", random.nextInt(30) + 1);
        
        return status;
    }
    
    /**
     * 模拟慢查询数据
     */
    private List<Map<String, Object>> getMockSlowQueries(DatabaseInstance instance) {
        List<Map<String, Object>> slowQueries = new ArrayList<>();
        Random random = new Random();
        
        int queryCount = random.nextInt(3) + 1;
        for (int i = 0; i < queryCount; i++) {
            Map<String, Object> query = new HashMap<>();
            query.put("query", "SELECT * FROM " + (random.nextBoolean() ? "users" : "orders") + " WHERE id > 1000");
            query.put("execution_time", String.format("%.3f", random.nextDouble() * 10 + 1));
            query.put("lock_time", String.format("%.3f", random.nextDouble() * 0.5));
            query.put("rows_sent", random.nextInt(1000));
            query.put("database", instance.getName());
            query.put("query_time", new Date().toString());
            slowQueries.add(query);
        }
        
        return slowQueries;
    }
    
    /**
     * 模拟活跃查询数据
     */
    private List<Map<String, Object>> getMockActiveQueries(DatabaseInstance instance) {
        List<Map<String, Object>> activeQueries = new ArrayList<>();
        Random random = new Random();
        
        int activeCount = random.nextInt(5) + 1;
        for (int i = 0; i < activeCount; i++) {
            Map<String, Object> query = new HashMap<>();
            query.put("id", i + 1);
            query.put("user", "app_user" + (i % 3 + 1));
            query.put("host", "localhost:5" + String.format("%04d", random.nextInt(9999)));
            query.put("db", instance.getName());
            query.put("command", random.nextBoolean() ? "Query" : "Sleep");
            query.put("time", random.nextInt(300));
            query.put("state", "executing");
            query.put("info", i % 2 == 0 ? "SELECT count(*) FROM users" : "UPDATE products SET price = price * 1.1");
            activeQueries.add(query);
        }
        
        return activeQueries;
    }
    
    /**
     * 模拟表空间数据
     */
    private List<Map<String, Object>> getMockTableSpace(DatabaseInstance instance) {
        List<Map<String, Object>> tableSpace = new ArrayList<>();
        Random random = new Random();
        
        String[] tables = {"users", "orders", "products", "logs", "system"};
        for (String table : tables) {
            Map<String, Object> spaceInfo = new HashMap<>();
            long size = (long)(random.nextDouble() * 1000000000 + 100000000); // 100MB到1.1GB
            spaceInfo.put("name", table);
            spaceInfo.put("size", size);
            spaceInfo.put("used", (long)(size * (random.nextDouble() * 0.3 + 0.6))); // 60%-90%使用率
            spaceInfo.put("available", size - (long)(spaceInfo.get("used")));
            spaceInfo.put("percent_used", String.format("%.1f", random.nextDouble() * 30 + 60));
            tableSpace.add(spaceInfo);
        }
        
        return tableSpace;
    }
    
    /**
     * 生成增强的模拟数据（作为备用）
     */
    private void generateEnhancedMockData(Map<String, Object> data, DatabaseInstance instance) {
        Random random = new Random();
        
        // 基本指标 - 修复nextLong参数问题
        long maxUptime = 30 * 24 * 60 * 60;
        long minUptime = 24 * 60 * 60;
        data.put("uptime", minUptime + (long)(random.nextDouble() * (maxUptime - minUptime))); // 1天到31天
        data.put("connections", random.nextInt(200) + 10);
        data.put("qps", String.format("%.1f", random.nextDouble() * 500 + 50));
        data.put("tps", String.format("%.1f", random.nextDouble() * 100 + 10));
        data.put("slow_queries", random.nextInt(20));
        data.put("threads_running", random.nextInt(30) + 1);
        
        // 慢查询列表
        List<Map<String, Object>> slowQueries = new ArrayList<Map<String, Object>>();
        int queryCount = random.nextInt(3) + 1;
        for (int i = 0; i < queryCount; i++) {
            Map<String, Object> query = new HashMap<>();
            query.put("query", "SELECT * FROM " + (random.nextBoolean() ? "users" : "orders") + " WHERE id > 1000");
            query.put("execution_time", String.format("%.3f", random.nextDouble() * 10 + 1));
            query.put("lock_time", String.format("%.3f", random.nextDouble() * 0.5));
            query.put("rows_sent", random.nextInt(1000));
            query.put("database", instance.getName());
            query.put("query_time", new java.util.Date().toString());
            slowQueries.add(query);
        }
        data.put("slow_queries_list", slowQueries);
        
        // 活跃查询列表
        List<Map<String, Object>> activeQueries = new ArrayList<Map<String, Object>>();
        int activeCount = random.nextInt(5) + 1;
        for (int i = 0; i < activeCount; i++) {
            Map<String, Object> query = new HashMap<>();
            query.put("id", i + 1);
            query.put("user", "app_user" + (i % 3 + 1));
            query.put("host", "localhost:5" + String.format("%04d", random.nextInt(9999)));
            query.put("db", instance.getName());
            query.put("command", random.nextBoolean() ? "Query" : "Sleep");
            query.put("time", random.nextInt(300));
            query.put("state", "executing");
            query.put("info", i % 2 == 0 ? "SELECT count(*) FROM users" : "UPDATE products SET price = price * 1.1");
            activeQueries.add(query);
        }
        data.put("active_queries", activeQueries);
        
        // 表空间信息
        List<Map<String, Object>> tableSpace = new ArrayList<Map<String, Object>>();
        String[] tables = {"users", "orders", "products", "logs", "system"};
        for (String table : tables) {
            Map<String, Object> spaceInfo = new HashMap<>();
            long size = (long)(random.nextDouble() * 1000000000 + 100000000); // 100MB到1.1GB
            spaceInfo.put("name", table);
            spaceInfo.put("size", size);
            long used = (long)(size * (random.nextDouble() * 0.3 + 0.6));
            spaceInfo.put("used", used); // 60%-90%使用率
            spaceInfo.put("available", size - used);
            spaceInfo.put("percent_used", String.format("%.1f", random.nextDouble() * 30 + 60));
            tableSpace.add(spaceInfo);
        }
        data.put("table_space", tableSpace);
        
        data.put("timestamp", System.currentTimeMillis());
    }
    
    /**
     * 生成初始监控数据
     */
    private Map<String, Object> generateInitialMonitoringData() {
        Map<String, Object> data = new HashMap<>();
        Random random = new Random();
        
        data.put("connections", random.nextInt(500) + 50);
        data.put("qps", random.nextInt(1000) + 100);
        data.put("tps", random.nextInt(500) + 50);
        data.put("slowQueries", random.nextInt(50));
        data.put("cpuUsage", random.nextDouble() * 80 + 10);
        data.put("memoryUsage", random.nextDouble() * 70 + 20);
        
        return data;
    }
    

}