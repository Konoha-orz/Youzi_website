package com.youzi.website.service;

import com.youzi.website.domain.dto.LoginDTO;
import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Admin;

import javax.servlet.http.HttpSession;

/**
 * Created by @杨健 on 2018/7/2 15:57
 *
 * @Des: 管理员服务
 */

public interface AdminService {
    /**
    * @param: Admin
    * @return: RespondBody
    * @Des: 管理员登录
    */
    RespondBody login(LoginDTO loginDTO, HttpSession session);
}
