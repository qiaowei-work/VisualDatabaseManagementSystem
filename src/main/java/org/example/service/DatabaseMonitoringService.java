package org.example.service;

import org.example.entity.DatabaseInstance;

import java.util.List;
import java.util.Map;

/**
 * 数据库监控服务接口
 * 提供获取真实MySQL监控数据的功能
 */
public interface DatabaseMonitoringService {
    
    /**
     * 获取数据库状态信息
     */
    Map<String, Object> getDatabaseStatus(DatabaseInstance instance);
    
    /**
     * 获取数据库连接数
     */
    int getConnectionCount(DatabaseInstance instance);
    
    /**
     * 获取QPS（每秒查询数）
     */
    double getQueriesPerSecond(DatabaseInstance instance);
    
    /**
     * 获取TPS（每秒事务数）
     */
    double getTransactionsPerSecond(DatabaseInstance instance);
    
    /**
     * 获取慢查询数量
     */
    int getSlowQueryCount(DatabaseInstance instance);
    
    /**
     * 获取活跃连接数
     */
    int getActiveConnections(DatabaseInstance instance);
    
    /**
     * 获取慢查询列表
     */
    List<Map<String, Object>> getSlowQueries(DatabaseInstance instance, int limit);
    
    /**
     * 获取活跃查询列表
     */
    List<Map<String, Object>> getActiveQueries(DatabaseInstance instance);
    
    /**
     * 获取表空间信息
     */
    List<Map<String, Object>> getTableSpaceInfo(DatabaseInstance instance);
    
    /**
     * 获取数据库运行时间
     */
    long getUptime(DatabaseInstance instance);
    
    /**
     * 获取综合监控数据
     */
    Map<String, Object> getComprehensiveMonitoringData(DatabaseInstance instance);
}