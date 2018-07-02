package com.youzi.website.service.impl;

import com.youzi.website.domain.dto.LoginDTO;
import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Admin;
import com.youzi.website.mapper.AdminMapper;
import com.youzi.website.service.AdminService;
import com.youzi.website.utils.MD5;
import com.youzi.website.utils.RespondBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpSession;

/**
 * Created by @杨健 on 2018/7/2 15:58
 *
 * @Des: 管理员登录实现类
 */
@Service("adminService")
public class AdminServiceImpl implements AdminService{
    @Resource
    private AdminMapper adminMapper;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Override
    public RespondBody login(LoginDTO loginDTO, HttpSession session) {
        RespondBody respondBody=new RespondBody();
        try {
            String captcha=stringRedisTemplate.opsForValue().get("captcha");
            //验证验证码
            if(captcha.equals(loginDTO.getCaptcha())){
                //验证密码
                Admin realAdmin=adminMapper.getByName(loginDTO.getName());
                if(realAdmin.getPassword()==null){
                    respondBody.setMsg("3");
                    return respondBody;
                }

                if(MD5.verify(loginDTO.getPassword(),realAdmin.getPassword())){
                    respondBody.setMsg("0");
                    session.setAttribute("admin",loginDTO.getName());
                    return respondBody;
                }else {
                    respondBody.setMsg("2");
                    return respondBody;
                }
            }else {
                respondBody.setMsg("1");
                return respondBody;
            }

        }catch (Exception e){
            e.printStackTrace();
            respondBody.setMsg("1");
            return respondBody;
        }
    }
}
