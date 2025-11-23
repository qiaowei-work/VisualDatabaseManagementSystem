package org.example.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 数据库监控Mapper接口
 * 用于获取数据库监控数据
 */
@Mapper
public interface DatabaseMonitoringMapper {

    /**
     * 获取全局状态信息
     */
    List<Map<String, Object>> getGlobalStatus();

    /**
     * 获取慢查询列表
     */
    List<Map<String, Object>> getSlowQueries(@Param("limit") int limit);

    /**
     * 获取活跃查询列表
     */
    List<Map<String, Object>> getActiveQueries();

    /**
     * 获取表空间信息
     */
    List<Map<String, Object>> getTableSpaceInfo();

    /**
     * 获取数据库运行时间
     */
    Long getUptime();

    /**
     * 获取数据库连接数
     */
    Integer getConnectionCount();

    /**
     * 获取慢查询数量
     */
    Integer getSlowQueryCount();

    /**
     * 获取活跃连接数
     */
    Integer getActiveConnections();

    /**
     * 获取QPS相关统计
     */
    Map<String, Object> getQueriesStats();

    /**
     * 获取TPS相关统计
     */
    Map<String, Object> getTransactionsStats();
}