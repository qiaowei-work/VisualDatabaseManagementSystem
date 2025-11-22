package org.example.service;

import org.example.entity.DatabaseInstance;

import java.util.List;

/**
 * 数据库实例服务接口
 */
public interface DatabaseInstanceService {
    
    /**
     * 获取所有数据库实例
     */
    List<DatabaseInstance> getAllInstances();
    
    /**
     * 根据ID获取实例
     */
    DatabaseInstance getInstanceById(Long id);
    
    /**
     * 添加数据库实例
     */
    boolean addInstance(DatabaseInstance instance);
    
    /**
     * 更新数据库实例
     */
    boolean updateInstance(DatabaseInstance instance);
    
    /**
     * 删除数据库实例
     */
    boolean deleteInstance(Long id);
    
    /**
     * 获取活跃的数据库实例
     */
    List<DatabaseInstance> getActiveInstances();
    
    /**
     * 测试数据库连接
     */
    boolean testConnection(DatabaseInstance instance);
}