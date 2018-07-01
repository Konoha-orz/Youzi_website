package com.youzi.website.mapper;

import com.youzi.website.domain.entity.Service;
import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/7/1 12:19
 *
 * @Des: 服务Mapper
 */
@Component("serviceMapper")
public interface ServiceMapper {
    /**
     * @param:
     * @return: List<Map>
     * @Des: 查询全部服务信息
     */
    List<Map> queryAllService();

    /**
     * @param: Case
     * @return:
     * @Des: 插入一条新的服务信息
     */
    int insert(Service service);

    /**
     * @param:
     * @return: List<Map>
     * @Des: 查询全部服务简要信息
     */
    List<Map> querySimpleService();

    /**
     * @param: Case
     * @return: int
     * @Des: 更新服务信息
     */
    int update(Service service);

    /**
     * @param: int caseId
     * @return: int
     * @Des: 根据ID删除案例
     */
    int deleteService(@Param("serviceId")int serviceId);

    /**
     * @param: cserviceId
     * @return: Map
     * @Des: 根据serviceId查询案例信息
     */
    Map queryById(@Param("serviceId")int serviceId);


}
