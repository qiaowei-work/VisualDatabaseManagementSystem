package org.example.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.entity.DatabaseInstance;

import java.util.List;

/**
 * 数据库实例Mapper接口
 */
@Mapper
public interface DatabaseInstanceMapper {
    
    /**
     * 查询所有数据库实例
     */
    List<DatabaseInstance> selectAllInstances();
    
    /**
     * 根据ID查询实例
     */
    DatabaseInstance selectById(@Param("id") Long id);
    
    /**
     * 插入新实例
     */
    int insert(DatabaseInstance instance);
    
    /**
     * 更新实例信息
     */
    int update(DatabaseInstance instance);
    
    /**
     * 删除实例
     */
    int delete(@Param("id") Long id);
    
    /**
     * 查询活跃状态的实例
     */
    List<DatabaseInstance> selectActiveInstances();
}