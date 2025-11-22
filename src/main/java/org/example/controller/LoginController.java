package org.example.controller;



import org.example.dto.LoginDTO;
import org.example.dto.LoginResultDTO;
import org.example.dto.RegisterDTO;
import org.example.dto.RegisterResultDTO;
import org.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;



@Controller
public class LoginController {

    @Autowired
    private UserService userService;

    /**
     * 显示登录页面
     */
    @GetMapping("/login")
    public String showLoginPage() {
        return "login";
    }

    /**
     * 处理登录请求
     */
    @PostMapping("/api/auth/login")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginDTO loginDTO,
                                                     BindingResult bindingResult) {
        Map<String, Object> result = new HashMap<>();

        // 参数验证
        if (bindingResult.hasErrors()) {
            result.put("code", 400);
            result.put("message", bindingResult.getFieldError().getDefaultMessage());
            return ResponseEntity.badRequest().body(result);
        }

        try {
            // 调用登录服务
            LoginResultDTO loginResult = userService.login(loginDTO);

            result.put("code", 200);
            result.put("message", "登录成功");
            result.put("data", loginResult);

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            result.put("code", 401);
            result.put("message", e.getMessage());
            return ResponseEntity.status(401).body(result);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "系统错误，请稍后重试");
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 处理注册请求
     */
    @PostMapping("/api/auth/register")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterDTO registerDTO,
                                                        BindingResult bindingResult) {
        Map<String, Object> result = new HashMap<>();

        // 参数验证
        if (bindingResult.hasErrors()) {
            result.put("code", 400);
            result.put("message", bindingResult.getFieldError().getDefaultMessage());
            return ResponseEntity.badRequest().body(result);
        }

        try {
            // 调用注册服务
            RegisterResultDTO registerResult = userService.register(registerDTO);

            result.put("code", 200);
            result.put("message", "注册成功");
            result.put("data", registerResult);

            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            result.put("code", 400);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("message", "系统错误，请稍后重试");
            return ResponseEntity.status(500).body(result);
        }
    }

    /**
     * 退出登录
     */
    @PostMapping("/api/auth/logout")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> logout() {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "退出成功");
        return ResponseEntity.ok(result);
    }
}