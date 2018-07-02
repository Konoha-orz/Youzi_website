package com.youzi.website.web;

import com.youzi.website.domain.dto.LoginDTO;
import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.service.AdminService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;
import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/7/2 16:21
 *
 * @Des: 管理员接口
 */
@RestController
public class AdminController {
    @Resource
    private AdminService adminService;

    /**
     * @param:
     * @return: RespondBody
     * @Des: 管理员登录接口
     */
    @RequestMapping(value = "/admin/login",method = RequestMethod.POST)
    public RespondBody login(@RequestBody LoginDTO loginDTO, HttpSession session){
        return adminService.login(loginDTO,session);
    }
}
