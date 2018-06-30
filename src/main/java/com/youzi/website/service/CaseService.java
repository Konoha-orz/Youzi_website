package com.youzi.website.service;

import com.youzi.website.domain.dto.CaseDTO;
import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Case;

import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/6/25 19:06
 *
 * @Des: 案例服务
 */

public interface CaseService {
    /**
    * @param:
    * @return: List<Map>
    * @Des: 查询全部案例信息
    */
    List<Map> queryAllCase();

    /**
    * @param: Case
    * @return:
    * @Des: 插入一条新的案例信息
    */
    int insert(CaseDTO caseDTO);

    /**
     * @param:
     * @return: List<Map>
     * @Des: 查询全部案列简要信息
     */
    RespondBody querySimpleCase();

    /**
     * @param: caseId
     * @return: Map
     * @Des: 根据caseId查询案例信息
     */
    Map queryById(int caseId);

    /**
     * @param: Case
     * @return: int
     * @Des: 更新案例信息
     */
    int update(CaseDTO caseDTO);

    /**
     * @param: int caseId
     * @return: int
     * @Des: 根据ID删除案例
     */
    int deleteCase(int caseId);

    /**
     * @param:
     * @return: List<Map>
     * @Des: 查询3个最新活动案例信息(图片轮播)
     */
    List<Map> queryNewCase();
}
