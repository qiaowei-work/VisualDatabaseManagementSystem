package org.example.dto;


public class RegisterResultDTO {
    private String username;
    private String email;
    private String realName;

    // 构造方法
    public RegisterResultDTO() {}

    public RegisterResultDTO(String username, String email, String realName) {
        this.username = username;
        this.email = email;
        this.realName = realName;
    }

    // getter和setter
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getRealName() { return realName; }
    public void setRealName(String realName) { this.realName = realName; }

    @Override
    public String toString() {
        return "RegisterResultDTO{" +
                "username='" + username + '\'' +
                ", email='" + email + '\'' +
                ", realName='" + realName + '\'' +
                '}';
    }
}
