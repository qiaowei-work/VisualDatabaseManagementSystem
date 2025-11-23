-- 创建数据库
CREATE DATABASE IF NOT EXISTS vdms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE vdms;

-- 创建系统用户表
CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码（MD5加密）',
    email VARCHAR(100) NOT NULL COMMENT '邮箱',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户表';

-- 插入初始数据（密码为123456的MD5加密）
INSERT INTO sys_user (username, password, email, real_name, status) VALUES
('admin', 'e10adc3949ba59abbe56e057f20f883e', 'admin@example.com', '系统管理员', 1),
('user', 'e10adc3949ba59abbe56e057f20f883e', 'user@example.com', '普通用户', 1);