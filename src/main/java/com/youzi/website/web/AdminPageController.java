package com.youzi.website.web;

import com.youzi.website.service.CaseService;
import org.apache.catalina.servlet4preview.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.annotation.Resource;
import java.util.Map;

/**
 * Created by @杨健 on 2018/6/26 14:35
 *
 * @Des: 后台页面控制器
 */
@Controller
public class AdminPageController {

    @Resource
    private CaseService caseService;

    @RequestMapping(value = "/admin")
    public String admin(){
        return "admin";
    }

    @RequestMapping(value = "/admin/caseDetail")
    public String adminCaseDetail(){
        return "admin-caseDetail";
    }

    @RequestMapping(value = "/admin/caseAdd")
    public String adminCaseAdd(){
        return "admin-caseAdd";
    }

    @RequestMapping(value = "/admin/caseEdit")
    public String adminCaseEdit(HttpServletRequest request, Model model){
        if(request.getParameter("caseId")==null||request.getParameter("caseId").equals(""))
            return "case";
        else {
            String caseId=request.getParameter("caseId");
            int id=Integer.valueOf(caseId);
            Map caseMap=caseService.queryById(id);
            model.addAttribute("case",caseMap);
            return "admin-caseEdit";
        }
    }
}
