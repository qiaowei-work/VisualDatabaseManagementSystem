package org.example.util;

import com.dingtalk.api.DefaultDingTalkClient;
import com.dingtalk.api.DingTalkClient;
import com.dingtalk.api.request.OapiRobotSendRequest;
import com.dingtalk.api.response.OapiRobotSendResponse;
import com.taobao.api.ApiException;
import org.apache.commons.codec.binary.Base64;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Logger;

/**
 * 钉钉机器人消息发送工具类
 * 提供向钉钉自定义机器人发送各类消息的功能
 */
public class DingTalkRobotUtil {
    private static final Logger logger = Logger.getLogger(DingTalkRobotUtil.class.getName());
    
    // 钉钉机器人API地址
    private static final String DINGTALK_ROBOT_API = "https://oapi.dingtalk.com/robot/send";
    
    // 可配置的属性:带默认值
    private String token = "56fb1f9fa6e0685ae240156cc18f037426f2abc9fe5b407afecfb60fb6b444d8";
    private String secret = "SECad318220ed9ccd38695adef7926d95c74ba60bd9116c11581ab21a1989e38499";
    
    /**
     * 构造函数
     * @param token 机器人Token
     * @param secret 机器人密钥
     */
    public DingTalkRobotUtil(String token, String secret) {
        this.token = token;
        this.secret = secret;
    }
    
    /**
     * 生成签名
     * @return 包含签名和时间戳的URL参数
     */
    private String generateSign() {
        try {
            Long timestamp = System.currentTimeMillis();
            String stringToSign = timestamp + "\n" + secret;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes("UTF-8"), "HmacSHA256"));
            byte[] signData = mac.doFinal(stringToSign.getBytes("UTF-8"));
            String sign = URLEncoder.encode(new String(Base64.encodeBase64(signData)), "UTF-8");
            return "sign=" + sign + "&timestamp=" + timestamp;
        } catch (UnsupportedEncodingException | NoSuchAlgorithmException | InvalidKeyException e) {
            logger.severe("生成签名失败: " + e.getMessage());
            throw new RuntimeException("生成钉钉机器人签名失败", e);
        }
    }
    
    /**
     * 发送文本消息
     * @param content 消息内容
     * @return 是否发送成功
     */
    public boolean sendTextMessage(String content) {
        return sendTextMessage(content, null, false);
    }
    
    /**
     * 发送文本消息并@指定用户
     * @param content 消息内容
     * @param atUserIds 被@用户的userId列表
     * @return 是否发送成功
     */
    public boolean sendTextMessage(String content, List<String> atUserIds) {
        return sendTextMessage(content, atUserIds, false);
    }
    
    /**
     * 发送文本消息
     * @param content 消息内容
     * @param atUserIds 被@用户的userId列表
     * @param isAtAll 是否@所有人
     * @return 是否发送成功
     */
    public boolean sendTextMessage(String content, List<String> atUserIds, boolean isAtAll) {
        try {
            // 构建请求URL
            String url = DINGTALK_ROBOT_API + "?" + generateSign();
            DingTalkClient client = new DefaultDingTalkClient(url);
            OapiRobotSendRequest request = new OapiRobotSendRequest();
            
            // 设置消息类型为文本
            request.setMsgtype("text");
            
            // 设置文本内容
            OapiRobotSendRequest.Text text = new OapiRobotSendRequest.Text();
            text.setContent(content);
            request.setText(text);
            
            // 设置@信息
            OapiRobotSendRequest.At at = new OapiRobotSendRequest.At();
            if (atUserIds != null && !atUserIds.isEmpty()) {
                at.setAtUserIds(atUserIds);
            }
            at.setIsAtAll(isAtAll);
            request.setAt(at);
            
            // 发送请求
            OapiRobotSendResponse response = client.execute(request, token);
            boolean success = response.isSuccess();
            
            if (success) {
                logger.info("钉钉机器人消息发送成功");
            } else {
                logger.warning("钉钉机器人消息发送失败: " + response.getErrmsg());
            }
            
            return success;
        } catch (ApiException e) {
            logger.severe("发送钉钉机器人消息异常: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * 发送告警消息（默认@所有人）
     * @param title 告警标题
     * @param message 告警详情
     * @return 是否发送成功
     */
    public boolean sendAlertMessage(String title, String message) {
        String content = "【告警通知】" + title + "\n" + message;
        return sendTextMessage(content, null, true);
    }
    
    /**
     * 发送普通通知消息
     * @param title 通知标题
     * @param message 通知详情
     * @return 是否发送成功
     */
    public boolean sendNotification(String title, String message) {
        String content = "【通知】" + title + "\n" + message;
        return sendTextMessage(content);
    }
    
    /**
     * 示例用法（可用于测试）
     */
    public static void main(String[] args) {
        // 示例：请替换为实际的token和secret
        String token = "56fb1f9fa6e0685ae240156cc18f037426f2abc9fe5b407afecfb60fb6b444d8";
        String secret = "SECad318220ed9ccd38695adef7926d95c74ba60bd9116c11581ab21a1989e38499";
        
        DingTalkRobotUtil robotUtil = new DingTalkRobotUtil(token, secret);
        robotUtil.sendTextMessage("监控，钉钉，让进步发生");
    }
}