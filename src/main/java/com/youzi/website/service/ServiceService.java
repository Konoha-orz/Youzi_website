package com.youzi.website.service;

import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Service;

import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/6/25 19:06
 *
 * @Des: 服务服务
 */

public interface ServiceService {
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
    RespondBody querySimpleService();

    /**
     * @param: caseId
     * @return: Map
     * @Des: 根据caseId查询服务信息
     */
    Map queryById(int serviceId);

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
    int deleteService(int serviceId);

}
