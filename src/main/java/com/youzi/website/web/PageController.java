package com.youzi.website.web;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;


/**
 * Created by @杨健 on 2018/6/6
 *
 * @Des: 页面控制器
 */
@Controller
public class PageController {

    @RequestMapping(value = "/index")
    public String indexPage(){
        return "index";
    }

    @RequestMapping(value = "/case")
    public String casePage(){
        return "case";
    }

    @RequestMapping(value = "/index(1)")
    public String index1Page(){
        return "index(1)";
    }
}
