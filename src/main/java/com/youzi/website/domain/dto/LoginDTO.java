package com.youzi.website.domain.dto;

import java.io.Serializable;

/**
 * Created by @杨健 on 2018/7/2 16:02
 *
 * @Des: 登录传输类
 */

public class LoginDTO implements Serializable{
    /**
     * 名字
     */
    private String name;

    /**
     * 密码
     */
    private String password;

    /**
     * 验证码
     */
    private String captcha;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getCaptcha() {
        return captcha;
    }

    public void setCaptcha(String captcha) {
        this.captcha = captcha;
    }
}
