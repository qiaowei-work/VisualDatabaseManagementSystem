package org.example.service.impl;

import org.example.entity.DatabaseInstance;
import org.example.mapper.DatabaseInstanceMapper;
import org.example.service.DatabaseInstanceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.sql.DriverManager;
import java.util.List;

/**
 * 数据库实例服务实现类
 */
@Service
public class DatabaseInstanceServiceImpl implements DatabaseInstanceService {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseInstanceServiceImpl.class);
    
    @Autowired
    private DatabaseInstanceMapper databaseInstanceMapper;
    
    @Override
    public List<DatabaseInstance> getAllInstances() {
        try {
            logger.info("查询所有数据库实例");
            return databaseInstanceMapper.selectAllInstances();
        } catch (Exception e) {
            logger.error("查询数据库实例失败", e);
            return null;
        }
    }
    
    @Override
    public DatabaseInstance getInstanceById(Long id) {
        try {
            logger.info("根据ID查询数据库实例: {}", id);
            return databaseInstanceMapper.selectById(id);
        } catch (Exception e) {
            logger.error("查询数据库实例失败", e);
            return null;
        }
    }
    
    @Override
    public boolean addInstance(DatabaseInstance instance) {
        try {
            logger.info("添加数据库实例: {}", instance.getName());
            instance.setStatus(1); // 默认启用
            int result = databaseInstanceMapper.insert(instance);
            return result > 0;
        } catch (Exception e) {
            logger.error("添加数据库实例失败", e);
            return false;
        }
    }
    
    @Override
    public boolean updateInstance(DatabaseInstance instance) {
        try {
            logger.info("更新数据库实例: {}", instance.getName());
            int result = databaseInstanceMapper.update(instance);
            return result > 0;
        } catch (Exception e) {
            logger.error("更新数据库实例失败", e);
            return false;
        }
    }
    
    @Override
    public boolean deleteInstance(Long id) {
        try {
            logger.info("删除数据库实例: {}", id);
            int result = databaseInstanceMapper.delete(id);
            return result > 0;
        } catch (Exception e) {
            logger.error("删除数据库实例失败", e);
            return false;
        }
    }
    
    @Override
    public List<DatabaseInstance> getActiveInstances() {
        try {
            logger.info("查询活跃的数据库实例");
            return databaseInstanceMapper.selectActiveInstances();
        } catch (Exception e) {
            logger.error("查询活跃数据库实例失败", e);
            return null;
        }
    }
    
    @Override
    public boolean testConnection(DatabaseInstance instance) {
        Connection conn = null;
        try {
            logger.info("测试数据库连接: {}:{}", instance.getHost(), instance.getPort());
            
            // 构建JDBC URL
            String url = String.format("jdbc:mysql://%s:%d/%s?useUnicode=true&characterEncoding=utf-8&useSSL=false&connectTimeout=5000",
                    instance.getHost(), instance.getPort(), instance.getDatabase() != null ? instance.getDatabase() : "");
            
            // 加载驱动
            Class.forName("com.mysql.cj.jdbc.Driver");
            
            // 建立连接
            conn = DriverManager.getConnection(url, instance.getUsername(), instance.getPassword());
            
            logger.info("数据库连接测试成功");
            return true;
        } catch (Exception e) {
            logger.error("数据库连接测试失败", e);
            return false;
        } finally {
            if (conn != null) {
                try {
                    conn.close();
                } catch (Exception e) {
                    logger.error("关闭连接失败", e);
                }
            }
        }
    }
}