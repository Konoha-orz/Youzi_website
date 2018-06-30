package com.youzi.website.domain.dto;

/**
 * Created by @杨健 on 2018/6/25 19:37
 *
 * @Des: 案例传输类
 */

public class CaseDTO {

    /**
     * 案例Id
     */
    private int caseId;

    /**
     * 标题
     */
    private String title;

    /**
     * 案例头像
     */
    private String caseImg;

    /**
     * 内容
     */
    private String content;

    /**
     *发布时间
     */
    private String createTime;

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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreateTime() {
        return createTime;
    }

    public void setCreateTime(String createTime) {
        this.createTime = createTime;
    }

    public int getCaseId() {
        return caseId;
    }

    public void setCaseId(int caseId) {
        this.caseId = caseId;
    }
}
