package org.example.service.impl;

import org.example.entity.DatabaseInstance;
import org.example.service.DatabaseMonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import org.example.mapper.DatabaseMonitoringMapper;
import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

/**
 * 数据库监控服务实现类
 * 使用JDBC获取真实的MySQL监控数据
 */
@Service
public class DatabaseMonitoringServiceImpl implements DatabaseMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseMonitoringServiceImpl.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private DatabaseMonitoringMapper monitoringMapper;
    
    @Override
    public Map<String, Object> getDatabaseStatus(DatabaseInstance instance) {
        Map<String, Object> status = new HashMap<>();
        Connection conn = null;
        
        try {
            conn = dataSource.getConnection();
            
            // 获取全局状态
            String statusQuery = "SHOW GLOBAL STATUS";
            Map<String, String> globalStatus = new HashMap<>();
            
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(statusQuery)) {
                while (rs.next()) {
                    globalStatus.put(rs.getString("Variable_name"), rs.getString("Value"));
                }
            }
            
            // 解析关键指标
            status.put("uptime", Long.parseLong(globalStatus.getOrDefault("Uptime", "0")));
            status.put("connections", Integer.parseInt(globalStatus.getOrDefault("Connections", "0")));
            status.put("threads_running", Integer.parseInt(globalStatus.getOrDefault("Threads_running", "0")));
            status.put("threads_connected", Integer.parseInt(globalStatus.getOrDefault("Threads_connected", "0")));
            status.put("slow_queries", Integer.parseInt(globalStatus.getOrDefault("Slow_queries", "0")));
            
            // 计算QPS和TPS
            long uptime = Long.parseLong(globalStatus.getOrDefault("Uptime", "1"));
            long queries = Long.parseLong(globalStatus.getOrDefault("Queries", "0"));
            long comCommit = Long.parseLong(globalStatus.getOrDefault("Com_commit", "0"));
            long comRollback = Long.parseLong(globalStatus.getOrDefault("Com_rollback", "0"));
            
            double qps = uptime > 0 ? (double) queries / uptime : 0.0;
            double tps = uptime > 0 ? (double) (comCommit + comRollback) / uptime : 0.0;
            
            status.put("qps", Math.round(qps * 100.0) / 100.0);
            status.put("tps", Math.round(tps * 100.0) / 100.0);
            
            logger.info("成功获取数据库 {} 的状态信息", instance.getName());
            
        } catch (Exception e) {
            logger.error("获取数据库状态失败: {}", e.getMessage());
            status.put("error", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        
        return status;
    }
    
    @Override
    public int getConnectionCount(DatabaseInstance instance) {
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            String query = "SELECT COUNT(*) as count FROM information_schema.processlist WHERE DB = DATABASE()";
            
            try (PreparedStatement stmt = conn.prepareStatement(query);
                 ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt("count");
                }
            }
        } catch (SQLException e) {
            logger.error("获取连接数失败", e);
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        return 0;
    }
    
    @Override
    public double getQueriesPerSecond(DatabaseInstance instance) {
        Map<String, Object> status = getDatabaseStatus(instance);
        return status.containsKey("qps") ? (Double) status.get("qps") : 0.0;
    }
    
    @Override
    public double getTransactionsPerSecond(DatabaseInstance instance) {
        Map<String, Object> status = getDatabaseStatus(instance);
        return status.containsKey("tps") ? (Double) status.get("tps") : 0.0;
    }
    
    @Override
    public int getSlowQueryCount(DatabaseInstance instance) {
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            String query = "SHOW STATUS LIKE 'Slow_queries'";
            
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                if (rs.next()) {
                    return rs.getInt("Value");
                }
            }
        } catch (Exception e) {
            logger.error("获取慢查询数量失败: {}", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        return 0;
    }
    
    @Override
    public int getActiveConnections(DatabaseInstance instance) {
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            String query = "SELECT COUNT(*) as active_connections FROM information_schema.PROCESSLIST WHERE COMMAND != 'Sleep'";
            
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                if (rs.next()) {
                    return rs.getInt("active_connections");
                }
            }
        } catch (Exception e) {
            logger.error("获取活跃连接数失败: {}", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        return 0;
    }
    
    @Override
    public List<Map<String, Object>> getSlowQueries(DatabaseInstance instance, int limit) {
        List<Map<String, Object>> slowQueries = new ArrayList<>();
        Connection conn = null;
        
        try {
            conn = dataSource.getConnection();
            
            // 查询慢查询日志（如果启用）
            String query = "SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT ?";
            
            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
                pstmt.setInt(1, limit);
                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        Map<String, Object> queryInfo = new HashMap<>();
                        queryInfo.put("query", rs.getString("sql_text"));
                        queryInfo.put("execution_time", rs.getString("query_time"));
                        queryInfo.put("lock_time", rs.getString("lock_time"));
                        queryInfo.put("rows_sent", rs.getInt("rows_sent"));
                        queryInfo.put("database", rs.getString("db"));
                        queryInfo.put("query_time", rs.getTimestamp("start_time"));
                        slowQueries.add(queryInfo);
                    }
                }
            }
            
            // 如果mysql.slow_log表不存在，尝试information_schema
            if (slowQueries.isEmpty()) {
                String alternativeQuery = "SELECT * FROM information_schema.PROCESSLIST WHERE TIME > 1 ORDER BY TIME DESC LIMIT ?";
                try (PreparedStatement pstmt = conn.prepareStatement(alternativeQuery)) {
                    pstmt.setInt(1, limit);
                    try (ResultSet rs = pstmt.executeQuery()) {
                        while (rs.next()) {
                            Map<String, Object> queryInfo = new HashMap<>();
                            queryInfo.put("query", rs.getString("INFO"));
                            queryInfo.put("execution_time", rs.getLong("TIME"));
                            queryInfo.put("lock_time", "0");
                            queryInfo.put("rows_sent", 0);
                            queryInfo.put("database", rs.getString("DB"));
                            queryInfo.put("query_time", new java.util.Date());
                            slowQueries.add(queryInfo);
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            logger.error("获取慢查询列表失败: {}", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        
        return slowQueries;
    }
    
    @Override
    public List<Map<String, Object>> getActiveQueries(DatabaseInstance instance) {
        List<Map<String, Object>> activeQueries = new ArrayList<>();
        Connection conn = null;
        
        try {
            conn = dataSource.getConnection();
            String query = "SELECT * FROM information_schema.PROCESSLIST WHERE COMMAND != 'Sleep' ORDER BY TIME DESC";
            
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                while (rs.next()) {
                    Map<String, Object> queryInfo = new HashMap<>();
                    queryInfo.put("id", rs.getLong("ID"));
                    queryInfo.put("user", rs.getString("USER"));
                    queryInfo.put("host", rs.getString("HOST"));
                    queryInfo.put("db", rs.getString("DB"));
                    queryInfo.put("command", rs.getString("COMMAND"));
                    queryInfo.put("time", rs.getLong("TIME"));
                    queryInfo.put("state", rs.getString("STATE"));
                    queryInfo.put("info", rs.getString("INFO"));
                    activeQueries.add(queryInfo);
                }
            }
            
        } catch (Exception e) {
            logger.error("获取活跃查询列表失败: {}", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        
        return activeQueries;
    }
    
    @Override
    public List<Map<String, Object>> getTableSpaceInfo(DatabaseInstance instance) {
        List<Map<String, Object>> tableSpace = new ArrayList<>();
        Connection conn = null;
        
        try {
            conn = dataSource.getConnection();
            String query = "SELECT table_schema, SUM(data_length + index_length) as size, SUM(data_length) as data_size, SUM(index_length) as index_size FROM information_schema.TABLES GROUP BY table_schema";
            
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                while (rs.next()) {
                    Map<String, Object> spaceInfo = new HashMap<>();
                    String schemaName = rs.getString("table_schema");
                    long size = rs.getLong("size");
                    long dataSize = rs.getLong("data_size");
                    long indexSize = rs.getLong("index_size");
                    
                    spaceInfo.put("name", schemaName);
                    spaceInfo.put("size", size);
                    spaceInfo.put("data_size", dataSize);
                    spaceInfo.put("index_size", indexSize);
                    spaceInfo.put("percent_used", "N/A"); // MySQL不直接提供使用率
                    tableSpace.add(spaceInfo);
                }
            }
            
        } catch (Exception e) {
            logger.error("获取表空间信息失败: {}", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        
        return tableSpace;
    }
    
    @Override
    public long getUptime(DatabaseInstance instance) {
        Connection conn = null;
        try {
            conn = dataSource.getConnection();
            String query = "SHOW STATUS LIKE 'Uptime'";
            
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery(query)) {
                if (rs.next()) {
                    return rs.getLong("Value");
                }
            }
        } catch (Exception e) {
            logger.error("获取运行时间失败: {}", e.getMessage());
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (SQLException e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
        return 0;
    }
    
    @Override
    public Map<String, Object> getComprehensiveMonitoringData(DatabaseInstance instance) {
        Map<String, Object> data = new HashMap<>();
        
        try {
            // 使用MyBatis获取全局状态信息
            List<Map<String, Object>> globalStatusList = monitoringMapper.getGlobalStatus();
            Map<String, String> globalStatus = new HashMap<>();
            for (Map<String, Object> status : globalStatusList) {
                globalStatus.put((String) status.get("Variable_name"), (String) status.get("Value"));
            }
            
            // 解析关键指标
            data.put("uptime", Long.parseLong(globalStatus.getOrDefault("Uptime", "0")));
            data.put("connections", Integer.parseInt(globalStatus.getOrDefault("Connections", "0")));
            data.put("threads_running", Integer.parseInt(globalStatus.getOrDefault("Threads_running", "0")));
            data.put("threads_connected", Integer.parseInt(globalStatus.getOrDefault("Threads_connected", "0")));
            data.put("slow_queries", Integer.parseInt(globalStatus.getOrDefault("Slow_queries", "0")));
            
            // 计算QPS和TPS
            long uptime = Long.parseLong(globalStatus.getOrDefault("Uptime", "1"));
            long queries = Long.parseLong(globalStatus.getOrDefault("Queries", "0"));
            long comCommit = Long.parseLong(globalStatus.getOrDefault("Com_commit", "0"));
            long comRollback = Long.parseLong(globalStatus.getOrDefault("Com_rollback", "0"));
            
            double qps = uptime > 0 ? (double) queries / uptime : 0.0;
            double tps = uptime > 0 ? (double) (comCommit + comRollback) / uptime : 0.0;
            
            data.put("qps", Math.round(qps * 100.0) / 100.0);
            data.put("tps", Math.round(tps * 100.0) / 100.0);
            
            // 使用MyBatis获取慢查询列表
            List<Map<String, Object>> slowQueries = monitoringMapper.getSlowQueries(10);
            data.put("slow_queries_list", slowQueries);
            
            // 使用MyBatis获取活跃查询列表
            List<Map<String, Object>> activeQueries = monitoringMapper.getActiveQueries();
            data.put("active_queries", activeQueries);
            
            // 使用MyBatis获取表空间信息
            List<Map<String, Object>> tableSpace = monitoringMapper.getTableSpaceInfo();
            data.put("table_space", tableSpace);
            
            // 添加时间戳
            data.put("timestamp", System.currentTimeMillis());
            
            logger.info("成功获取数据库 {} 的综合监控数据", instance.getName());
            
        } catch (Exception e) {
            logger.error("获取综合监控数据失败: {}", e.getMessage());
            data.put("error", e.getMessage());
        }
        
        return data;
    }
    

}