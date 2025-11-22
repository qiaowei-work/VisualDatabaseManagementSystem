package org.example.controller;

import org.example.entity.User;
import org.example.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户管理控制器
 */
@RestController
@RequestMapping("/api/users")
public class UserManagementController {

    private static final Logger logger = LoggerFactory.getLogger(UserManagementController.class);
    
    private final UserService userService;
    
    @Autowired
    public UserManagementController(UserService userService) {
        this.userService = userService;
    }
    
    /**
     * 获取所有用户列表
     */
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        logger.debug("获取用户列表请求");
        
        try {
            List<User> users = userService.getAllUsers();
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 200);
            result.put("message", "查询成功");
            result.put("data", users);
            
            logger.debug("获取用户列表成功，共{}条记录", users.size());
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            logger.error("获取用户列表失败", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("code", 500);
            result.put("message", "系统错误，请稍后重试");
            
            return ResponseEntity.status(500).body(result);
        }
    }
}