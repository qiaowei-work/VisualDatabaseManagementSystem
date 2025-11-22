package org.example.controller;


import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    /**
     * 首页 - 重定向到仪表盘
     */
    @GetMapping("/")
    public String index() {
        return "redirect:/dashboard";
    }

//    /**
//     * 登录页面
//     */
//    @GetMapping("/login")
//    public String showLoginPage() {
//        return "login";
//    }

    /**
     * 仪表盘页面（主页面）
     */
    @GetMapping("/dashboard")
    public String dashboard() {
        return "dashboard";
    }

    /**
     * 用户管理页面
     */
    @GetMapping("/user-management")
    public String showUserManagement() {
        return "user-management";
    }

    /**
     * 实例管理页面
     */
    @GetMapping("/instance-management")
    public String showInstanceManagement() {
        return "instance-management";
    }

    /**
     * 系统监控页面
     */
    @GetMapping("/system-monitoring")
    public String showSystemMonitoring() {
        return "system-monitoring";
    }

    /**
     * SQL操作页面
     */
    @GetMapping("/server-monitoring")
    public String showSqlOperation() {
        return "server-monitoring";
    }

    /**
     *
     */
    @GetMapping("/warning-rules")
    public String showPerformanceAnalysis() {
        return "warning-rules";
    }

    /**
     * 报警历史页面
     */
    @GetMapping("/alert-history")
    public String showAlertHistory() {
        return "alert-history";
    }
}