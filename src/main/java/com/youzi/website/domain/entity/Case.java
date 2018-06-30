package com.youzi.website.domain.entity;

import java.io.Serializable;
import java.util.Date;

/**
 * Created by @杨健 on 2018/6/25 18:45
 *
 * @Des: 案例实体类
 */

public class Case implements Serializable{
    /**
     * 案例ID
     */
    private int caseId;

    /**
     * 案例标题
     */
    private String title;

    /**
     * 案例头像
     */
    private String caseImg;

    /**
     * 发布时间
     */
    private String createTime;

    /**
     * 内容
     */
    private String content;

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCaseImg() {
        return caseImg;
    }

    public void setCaseImg(String caseImg) {
        this.caseImg = caseImg;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
