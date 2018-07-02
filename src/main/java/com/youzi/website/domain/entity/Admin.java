package com.youzi.website.domain.entity;

import java.io.Serializable;

/**
 * Created by @杨健 on 2018/7/2 15:49
 *
 * @Des:
 */

public class Admin implements Serializable {
    /**
     * ID
     */
    private int adminId;

    /**
     * 名称
     */
    private String name;

    /**
     * 密码
     */
    private String password;

    public int getAdminId() {
        return adminId;
    }

    public void setAdminId(int adminId) {
        this.adminId = adminId;
    }

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
}
