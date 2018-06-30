package com.youzi.website.utils;


import com.youzi.website.domain.dto.RespondBody;

/**
 * Created by @杨健 on 2018/4/1 17:43
 *
 * @Des: 消息载体构建工具类
 */

public class RespondBuilder {
    public static RespondBody buildNormalResponse(Object object) {

        RespondBody respondBody = new RespondBody();
        respondBody.setCode("0");
        respondBody.setMsg("0000");
        respondBody.setData(object);
        return respondBody;
    }

    public static RespondBody buildErrorResponse(String msg) {
        RespondBody respondBody = new RespondBody();
        respondBody.setCode("1");
        respondBody.setMsg(msg);
        respondBody.setData(null);
        return respondBody;
    }


}

