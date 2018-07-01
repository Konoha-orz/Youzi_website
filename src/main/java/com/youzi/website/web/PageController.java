package com.youzi.website.web;

import com.youzi.website.service.CaseService;
import com.youzi.website.service.ServiceService;
import org.apache.catalina.servlet4preview.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;


/**
 * Created by @杨健 on 2018/6/6
 *
 * @Des: 页面控制器
 */
@Controller
public class PageController {

    @Resource
    private CaseService caseService;

    @Resource
    private ServiceService serviceService;


    /**
     * 主页
     */
    @RequestMapping(value = "/index")
    public String indexPage(Model model){
        List<Map> caseList=caseService.queryNewCase();
        for(int i=1;i<=caseList.size();i++){
            model.addAttribute("case"+i,caseList.get(i-1));
        }
        return "index";
    }

    /**
     * 案例页
     */
    @RequestMapping(value = "/case")
    public String casePage(Model model){
        //图片轮播
        List<Map> newCaseList=caseService.queryNewCase();
        for(int i=1;i<=newCaseList.size();i++){
            model.addAttribute("case"+i,newCaseList.get(i-1));
        }
        //案例
        List<Map> caseList= caseService.queryAllCase();
        model.addAttribute("caseList",caseList);
        return "case";
    }

    /**
     *
     */
    @RequestMapping(value = "/index(1)")
    public String index1Page(){
        return "index(1)";
    }

    @RequestMapping(value = "/editor")
    public String editor(){
        return "editor";
    }

    /**
     * 案例详情
     */
    @RequestMapping(value = "/caseDetail")
    public String caseDetail(HttpServletRequest request,Model model){
        if(request.getParameter("caseId")==null||request.getParameter("caseId").equals(""))
            return "case";
        else {
            String caseId=request.getParameter("caseId");
            int id=Integer.valueOf(caseId);
            Map caseMap=caseService.queryById(id);
            model.addAttribute("case",caseMap);
            return "caseDetail";
        }

    }

    /**
     * 服务
     */
    @RequestMapping(value = "/service")
    public String service(Model model){
        List<Map> serviceList= serviceService.queryAllService();
        Map firstService=serviceList.get(0);
        serviceList.remove(0);
        model.addAttribute("serviceList",serviceList);
        model.addAttribute("firstService",firstService);
        return "service";
    }

    /**
     * 联系我们
     */
    @RequestMapping(value = "/contact")
    public String contact(Model model){
        return "contact";
    }


}
