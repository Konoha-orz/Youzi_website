package com.youzi.website.domain.entity;

import java.io.Serializable;

/**
 * Created by @杨健 on 2018/7/1 12:22
 *
 * @Des: 服务实体类
 */

public class Service implements Serializable{
    /**
     * 服务ID
     */
    private int serviceId;

    /**
     *  标题
     */
    private String title;

    /**
     * 内容
     */
    private String content;

    public int getServiceId() {
        return serviceId;
    }

    public void setServiceId(int serviceId) {
        this.serviceId = serviceId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
