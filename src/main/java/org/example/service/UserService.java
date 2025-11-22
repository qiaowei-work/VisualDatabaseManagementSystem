package org.example.service;


import org.example.dto.LoginDTO;
import org.example.dto.LoginResultDTO;
import org.example.dto.RegisterDTO;
import org.example.dto.RegisterResultDTO;
import org.example.entity.User;
import java.util.List;

public interface UserService {

    /**
     * 用户登录
     */
    LoginResultDTO login(LoginDTO loginDTO);

    /**
     * 用户注册
     */
    RegisterResultDTO register(RegisterDTO registerDTO);

    /**
     * 根据用户名查找用户
     */
    User findByUsername(String username);

    /**
     * 根据邮箱查找用户
     */
    User findByEmail(String email);

    /**
     * 验证用户密码
     */
    boolean validatePassword(String inputPassword, String storedPassword);

    /**
     * 检查用户名是否已存在
     */
    boolean isUsernameExists(String username);

    /**
     * 检查邮箱是否已存在
     */
    boolean isEmailExists(String email);
    
    /**
     * 获取所有用户列表
     */
    List<User> getAllUsers();
}