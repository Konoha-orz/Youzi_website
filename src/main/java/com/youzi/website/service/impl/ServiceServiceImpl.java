package com.youzi.website.service.impl;

import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Service;
import com.youzi.website.mapper.ServiceMapper;
import com.youzi.website.service.ServiceService;
import com.youzi.website.utils.RespondBuilder;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/7/1 12:35
 *
 * @Des: 服务服务实现类
 */

@org.springframework.stereotype.Service("serviceService")
public class ServiceServiceImpl implements ServiceService{

    @Resource
    private ServiceMapper serviceMapper;

    @Override
    public List<Map> queryAllService() {
        List<Map> result=serviceMapper.queryAllService();
        result.get(0).put("isFirst",1);
        return result;
    }

    @Override
    public int insert(Service service) {
        serviceMapper.insert(service);
        return service.getServiceId();
    }

    @Override
    public RespondBody querySimpleService() {
        RespondBody respondBody;
        try{
            List<Map> data=serviceMapper.querySimpleService();
            respondBody= RespondBuilder.buildNormalResponse(data);
        }catch (Exception e){
            e.printStackTrace();
            respondBody= RespondBuilder.buildErrorResponse(e.getMessage());
        }
        return respondBody;
    }

    @Override
    public Map queryById(int serviceId) {
        try{
            return serviceMapper.queryById(serviceId);
        }catch (Exception e){
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public int update(Service service) {
        return serviceMapper.update(service);
    }

    @Override
    public int deleteService(int serviceId) {
        return serviceMapper.deleteService(serviceId);
    }
}
