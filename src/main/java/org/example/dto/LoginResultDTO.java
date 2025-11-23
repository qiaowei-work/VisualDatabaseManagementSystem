package org.example.dto;


public class LoginResultDTO {
    private String token;
    private String username;
    private String realName;
    private String email;

    // 构造方法
    public LoginResultDTO() {}

    public LoginResultDTO(String token, String username, String realName, String email) {
        this.token = token;
        this.username = username;
        this.realName = realName;
        this.email = email;
    }

    // getter和setter
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}