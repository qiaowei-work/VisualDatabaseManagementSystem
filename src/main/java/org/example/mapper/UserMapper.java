package org.example.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.example.entity.User;
import java.util.List;

@Mapper
public interface UserMapper {
    
    /**
     * 根据用户名查询用户
     */
    User selectByUsername(@Param("username") String username);
    
    /**
     * 根据邮箱查询用户
     */
    User selectByEmail(@Param("email") String email);
    
    /**
     * 插入新用户
     */
    int insert(User user);
    
    /**
     * 检查用户名是否存在
     */
    int countByUsername(@Param("username") String username);
    
    /**
     * 检查邮箱是否存在
     */
    int countByEmail(@Param("email") String email);
    
    /**
     * 查询所有用户列表
     */
    List<User> selectAllUsers();
}