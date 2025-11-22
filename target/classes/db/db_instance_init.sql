-- 创建数据库实例表
CREATE TABLE IF NOT EXISTS db_instance (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '实例ID',
    name VARCHAR(100) NOT NULL COMMENT '实例名称',
    host VARCHAR(100) NOT NULL COMMENT '主机地址',
    port INT NOT NULL COMMENT '端口号',
    username VARCHAR(100) NOT NULL COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    `database` VARCHAR(100) COMMENT '数据库名（可选）',
    environment VARCHAR(50) NOT NULL COMMENT '环境类型：production, testing, development',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_environment (environment)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据库实例表';

-- 插入模拟数据
INSERT INTO db_instance (name, host, port, username, password, `database`, environment, status)
VALUES
('主数据库', '192.168.1.100', 3306, 'root', 'e10adc3949ba59abbe56e057f20f883e', 'vdms', 'production', 1),
('从数据库', '192.168.1.101', 3306, 'root', 'e10adc3949ba59abbe56e057f20f883e', 'vdms', 'production', 1),
('测试数据库', '192.168.1.102', 3306, 'root', 'e10adc3949ba59abbe56e057f20f883e', 'test_db', 'testing', 1),
('开发数据库', 'localhost', 3306, 'root', 'WeiQiao97..', 'vdms_dev', 'development', 1);