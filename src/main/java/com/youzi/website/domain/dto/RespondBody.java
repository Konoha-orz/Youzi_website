package com.youzi.website.domain.dto;

import java.io.Serializable;

/**
 * Created by 杨健 on 2018/3/30
 *
 * @Des: 接口返回信息体
 */

public class RespondBody implements Serializable{

    private String code;

    //调用返回失败信息，0000为成功
    private String msg;

    //数据载体
    private Object data;

    //返回数据量
    private String count;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMsg() {
        return msg;
    }

    public void setMsg(String msg) {
        this.msg = msg;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getCount() {
        return count;
    }

    public void setCount(String count) {
        this.count = count;
    }
}
