package org.example.controller;

// InstanceManagementController.java

import org.example.dto.ApiResponseDTO;
import org.example.entity.DatabaseInstance;
import org.example.service.DatabaseInstanceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/api/instance")
public class InstanceManagementController {
    // 实例管理的API接口

    private static final Logger logger = LoggerFactory.getLogger(SystemMonitoringController.class);

    @Autowired
    private DatabaseInstanceService databaseInstanceService;


    @GetMapping("/list")
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

    /**
     * 根据ID获取实例详情
     */
    @GetMapping("/{id}")
    public ApiResponseDTO<DatabaseInstance> getInstanceById(@PathVariable Long id) {
        try {
            logger.info("获取实例详情，ID: {}", id);
            DatabaseInstance instance = databaseInstanceService.getInstanceById(id);
            if (instance == null) {
                return ApiResponseDTO.fail(404, "实例不存在");
            }
            return ApiResponseDTO.success(instance);
        } catch (Exception e) {
            logger.error("获取实例详情失败，ID: " + id, e);
            return ApiResponseDTO.serverError("获取实例详情失败：" + e.getMessage());
        }
    }

    /**
     * 添加数据库实例
     */
    @PostMapping("/addInstance")
//    @ResponseBody
    public ApiResponseDTO<DatabaseInstance> addInstance(@RequestBody DatabaseInstance instance) {
        try {
            logger.info("添加数据库实例：{}", instance.getName());
            
            // 验证必填字段
            if (instance.getName() == null || instance.getName().trim().isEmpty()) {
                return ApiResponseDTO.paramError("实例名称不能为空");
            }
            if (instance.getHost() == null || instance.getHost().trim().isEmpty()) {
                return ApiResponseDTO.paramError("主机地址不能为空");
            }
            if (instance.getPort() == null || instance.getPort() <= 0) {
                return ApiResponseDTO.paramError("端口不能为空且必须大于0");
            }
            if (instance.getUsername() == null || instance.getUsername().trim().isEmpty()) {
                return ApiResponseDTO.paramError("用户名不能为空");
            }
            if (instance.getPassword() == null || instance.getPassword().trim().isEmpty()) {
                return ApiResponseDTO.paramError("密码不能为空");
            }
            
            // 测试连接
            boolean connected = databaseInstanceService.testConnection(instance);
            if (!connected) {
                return ApiResponseDTO.fail(500, "无法连接到数据库实例");
            }
            
            // 设置默认状态为启用
            instance.setStatus(1);
            
            // 保存实例
            boolean success = databaseInstanceService.addInstance(instance);
            if (success) {
                logger.info("数据库实例添加成功：{}", instance.getId());
                return ApiResponseDTO.success(instance);
            } else {
                return ApiResponseDTO.serverError("添加实例失败");
            }
        } catch (Exception e) {
            logger.error("添加数据库实例失败", e);
            return ApiResponseDTO.serverError("添加实例失败：" + e.getMessage());
        }
    }

    /**
     * 更新数据库实例
     */
    @PutMapping("/{id}")
    public ApiResponseDTO<DatabaseInstance> updateInstance(@PathVariable Long id, @RequestBody DatabaseInstance instance) {
        try {
            logger.info("更新数据库实例，ID: {}", id);
            
            // 检查实例是否存在
            DatabaseInstance existingInstance = databaseInstanceService.getInstanceById(id);
            if (existingInstance == null) {
                return ApiResponseDTO.fail(404, "实例不存在");
            }
            
            // 设置ID
            instance.setId(id);
            
            // 测试连接
            boolean connected = databaseInstanceService.testConnection(instance);
            if (!connected) {
                return ApiResponseDTO.fail(500, "无法连接到数据库实例");
            }
            
            // 更新实例
            boolean success = databaseInstanceService.updateInstance(instance);
            if (success) {
                logger.info("数据库实例更新成功：{}", id);
                return ApiResponseDTO.success(instance);
            } else {
                return ApiResponseDTO.serverError("更新实例失败");
            }
        } catch (Exception e) {
            logger.error("更新数据库实例失败，ID: " + id, e);
            return ApiResponseDTO.serverError("更新实例失败：" + e.getMessage());
        }
    }

    /**
     * 删除数据库实例
     */
    @DeleteMapping("/{id}")
    public ApiResponseDTO<String> deleteInstance(@PathVariable Long id) {
        try {
            logger.info("删除数据库实例，ID: {}", id);
            
            // 检查实例是否存在
            DatabaseInstance existingInstance = databaseInstanceService.getInstanceById(id);
            if (existingInstance == null) {
                return ApiResponseDTO.fail(404, "实例不存在");
            }
            
            // 删除实例
            databaseInstanceService.deleteInstance(id);
            logger.info("数据库实例删除成功：{}", id);
            return ApiResponseDTO.success("实例删除成功");
        } catch (Exception e) {
            logger.error("删除数据库实例失败，ID: " + id, e);
            return ApiResponseDTO.serverError("删除实例失败：" + e.getMessage());
        }
    }

    /**
     * 测试数据库连接
     */
    @PostMapping("/test-connection")
    public ApiResponseDTO<String> testConnection(@RequestBody DatabaseInstance instance) {
        try {
            logger.info("测试数据库连接：{}@{}", instance.getUsername(), instance.getHost());
            
            // 验证必填字段
            if (instance.getHost() == null || instance.getHost().trim().isEmpty()) {
                return ApiResponseDTO.paramError("主机地址不能为空");
            }
            if (instance.getPort() == null || instance.getPort() <= 0) {
                return ApiResponseDTO.paramError("端口不能为空且必须大于0");
            }
            if (instance.getUsername() == null || instance.getUsername().trim().isEmpty()) {
                return ApiResponseDTO.paramError("用户名不能为空");
            }
            if (instance.getPassword() == null || instance.getPassword().trim().isEmpty()) {
                return ApiResponseDTO.paramError("密码不能为空");
            }
            
            // 测试连接
            boolean connected = databaseInstanceService.testConnection(instance);
            if (connected) {
                logger.info("数据库连接测试成功：{}@{}", instance.getUsername(), instance.getHost());
                return ApiResponseDTO.success("连接测试成功");
            } else {
                logger.warn("数据库连接测试失败：{}@{}", instance.getUsername(), instance.getHost());
                return ApiResponseDTO.fail(500, "连接测试失败");
            }
        } catch (Exception e) {
            logger.error("测试数据库连接失败", e);
            return ApiResponseDTO.serverError("连接测试失败：" + e.getMessage());
        }
    }
}

