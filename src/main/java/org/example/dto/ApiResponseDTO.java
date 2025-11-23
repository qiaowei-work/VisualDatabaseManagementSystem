package org.example.dto;

/**
 * API响应结果DTO
 */
public class ApiResponseDTO<T> {
    private int code; // 状态码：200成功，其他失败
    private String message; // 响应消息
    private T data; // 响应数据
    private long timestamp; // 时间戳
    
    public ApiResponseDTO() {
        this.timestamp = System.currentTimeMillis();
    }
    
    // Getters and Setters
    public int getCode() {
        return code;
    }
    
    public void setCode(int code) {
        this.code = code;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
    
    /**
     * 成功响应
     */
    public static <T> ApiResponseDTO<T> success(T data) {
        ApiResponseDTO<T> response = new ApiResponseDTO<>();
        response.setCode(200);
        response.setMessage("操作成功");
        response.setData(data);
        return response;
    }
    
    /**
     * 失败响应
     */
    public static <T> ApiResponseDTO<T> fail(int code, String message) {
        ApiResponseDTO<T> response = new ApiResponseDTO<>();
        response.setCode(code);
        response.setMessage(message);
        return response;
    }
    
    /**
     * 参数错误响应
     */
    public static <T> ApiResponseDTO<T> paramError(String message) {
        return fail(400, message);
    }
    
    /**
     * 服务器错误响应
     */
    public static <T> ApiResponseDTO<T> serverError(String message) {
        return fail(500, message);
    }
}