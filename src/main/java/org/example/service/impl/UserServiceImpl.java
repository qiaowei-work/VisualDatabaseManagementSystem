package org.example.service.impl;



import org.example.dto.LoginDTO;
import org.example.dto.LoginResultDTO;
import org.example.dto.RegisterDTO;
import org.example.dto.RegisterResultDTO;
import org.example.entity.User;
import org.example.mapper.UserMapper;
import org.example.service.UserService;
import java.util.List;
import org.example.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.util.Date;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);
    
    private final UserMapper userMapper;
    
    @Autowired
    public UserServiceImpl(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    @Override
    public LoginResultDTO login(LoginDTO loginDTO) {
        String username = loginDTO.getUsername();
        String password = loginDTO.getPassword();
        
        logger.debug("用户[{}]尝试登录", username);

        // 查找用户
        User user = findByUsername(username);
        if (user == null) {
            logger.warn("用户[{}]不存在", username);
            throw new RuntimeException("用户不存在");
        }

        // 检查用户状态
        if (user.getStatus() != null && user.getStatus() == 0) {
            logger.warn("用户[{}]已被禁用", username);
            throw new RuntimeException("用户已被禁用，请联系管理员");
        }

        // 验证密码
        if (!validatePassword(password, user.getPassword())) {
            logger.warn("用户[{}]密码错误", username);
            throw new RuntimeException("密码错误");
        }

        // 生成JWT token
        String token = JwtUtil.generateToken(username);
        logger.debug("用户[{}]登录成功，生成token", username);

        // 返回登录结果
        return new LoginResultDTO(token, user.getUsername(), user.getRealName(), user.getEmail());
    }

    @Override
    public RegisterResultDTO register(RegisterDTO registerDTO) {
        String username = registerDTO.getUsername();
        String password = registerDTO.getPassword();
        String confirmPassword = registerDTO.getConfirmPassword();
        String email = registerDTO.getEmail();
        String realName = registerDTO.getRealName();

        // 验证两次密码是否一致
        if (!password.equals(confirmPassword)) {
            throw new RuntimeException("两次输入的密码不一致");
        }

        // 检查用户名是否已存在
        if (isUsernameExists(username)) {
            throw new RuntimeException("用户名已存在");
        }

        // 检查邮箱是否已存在
        if (isEmailExists(email)) {
            throw new RuntimeException("邮箱已被注册");
        }

        // 创建新用户
        User newUser = new User();
        newUser.setUsername(username);
        newUser.setPassword(DigestUtils.md5DigestAsHex(password.getBytes())); // MD5加密密码
        newUser.setEmail(email);
        newUser.setRealName(realName);
        newUser.setStatus(1); // 默认启用
        newUser.setCreateTime(new Date());
        newUser.setUpdateTime(new Date());

        // 保存用户到数据库
        int result = userMapper.insert(newUser);
        if (result != 1) {
            throw new RuntimeException("用户注册失败，请稍后重试");
        }

        // 返回注册结果
        return new RegisterResultDTO(newUser.getUsername(), newUser.getEmail(), newUser.getRealName());
    }

    @Override
    public User findByUsername(String username) {
        logger.debug("查询用户名[{}]的用户信息", username);
        return userMapper.selectByUsername(username);
    }

    @Override
    public User findByEmail(String email) {
        logger.debug("查询邮箱[{}]的用户信息", email);
        return userMapper.selectByEmail(email);
    }

    @Override
    public boolean validatePassword(String inputPassword, String storedPassword) {
        // MD5加密输入密码后比较
        String encryptedInput = DigestUtils.md5DigestAsHex(inputPassword.getBytes());
        return encryptedInput.equals(storedPassword);
    }

    @Override
    public boolean isUsernameExists(String username) {
        logger.debug("检查用户名[{}]是否存在", username);
        return userMapper.countByUsername(username) > 0;
    }

    @Override
    public boolean isEmailExists(String email) {
        logger.debug("检查邮箱[{}]是否存在", email);
        return userMapper.countByEmail(email) > 0;
    }
    
    @Override
    public List<User> getAllUsers() {
        logger.debug("获取所有用户列表");
        return userMapper.selectAllUsers();
    }
}