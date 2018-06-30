package com.youzi.website.web;

import com.youzi.website.domain.dto.CaseDTO;
import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.service.CaseService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/6/25 19:09
 *
 * @Des: 案例控制器
 */
@RestController
@RequestMapping(value = "/case")
public class CaseController {
    @Resource
    private CaseService caseService;

    /**
    * @param:
    * @return: List<Map>
    * @Des: 查询全部案例信息接口
    */
    @RequestMapping(value = "/queryAll",method = RequestMethod.GET)
    public List<Map> queryAllCase(){
        return caseService.queryAllCase();
    }

    /**
    * @param: CaseDTO
    * @return: int
    * @Des: 新增案例接口
    */
    @RequestMapping(value = "/insert",method = RequestMethod.POST)
    public int insert(@RequestBody CaseDTO caseDTO){
        return caseService.insert(caseDTO);
    }

    /**
    * @param: RespondBody
    * @return:  RespondBody
    * @Des: 查询案例简要信息接口
    */
    @RequestMapping(value = "/querySimpleCase",method = RequestMethod.GET)
    public RespondBody querySimpleCase(){
        return caseService.querySimpleCase();
    }

    /**
    * @param: CaseDTO
    * @return: int
    * @Des: 更新案例信息接口
    */
    @RequestMapping(value = "/update",method = RequestMethod.POST)
    public int update(@RequestBody CaseDTO caseDTO){
        return caseService.update(caseDTO);
    }

    /**
    * @param: caseId
    * @return: int
    * @Des: 删除案例接口
    */
    @RequestMapping(value = "/delete",method = RequestMethod.POST)
    public int deleteCase(@RequestBody CaseDTO caseDTO){
        return caseService.deleteCase(caseDTO.getCaseId());
    }

}
