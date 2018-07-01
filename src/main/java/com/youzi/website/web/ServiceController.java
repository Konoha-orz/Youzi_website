package com.youzi.website.web;

import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Service;
import com.youzi.website.service.ServiceService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/7/1 12:39
 *
 * @Des: 服务控制器
 */

@RestController
@RequestMapping(value = "/service")
public class ServiceController {

    @Resource
    private ServiceService serviceService;

    /**
     * @param:
     * @return: List<Map>
     * @Des: 查询全部服务信息接口
     */
    @RequestMapping(value = "/queryAll",method = RequestMethod.GET)
    public List<Map> queryAllCase(){
        return serviceService.queryAllService();
    }

    /**
     * @param: CaseDTO
     * @return: int
     * @Des: 新增服务接口
     */
    @RequestMapping(value = "/insert",method = RequestMethod.POST)
    public int insert(@RequestBody Service service){
        return serviceService.insert(service);
    }

    /**
     * @param: RespondBody
     * @return:  RespondBody
     * @Des: 查询服务简要信息接口
     */
    @RequestMapping(value = "/querySimpleService",method = RequestMethod.GET)
    public RespondBody querySimpleCase(){
        return serviceService.querySimpleService();
    }

    /**
     * @param: Service
     * @return: int
     * @Des: 更新服务信息接口
     */
    @RequestMapping(value = "/update",method = RequestMethod.POST)
    public int update(@RequestBody Service service){
        return serviceService.update(service);
    }

    /**
     * @param: serviceId
     * @return: int
     * @Des: 删除服务接口
     */
    @RequestMapping(value = "/delete",method = RequestMethod.POST)
    public int deleteCase(@RequestBody Service service){
        return serviceService.deleteService(service.getServiceId());
    }
}
