package com.youzi.website.mapper;


import com.youzi.website.domain.entity.Case;
import org.apache.ibatis.annotations.Param;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/6/25 18:52
 *
 * @Des: 案例Mappper
 */

@Component("caseMapper")
public interface CaseMapper {
    /**
    * @param:
    * @return: List<Case>
    * @Des: 查询全部案例信息
    */
    List<Map> queryAllCase();

    /**
    * @param: Case
    * @return:
    * @Des: 插入一条新的案例信息
    */
    int insert(Case newcase);

    /**
    * @param:
    * @return: List<Map>
    * @Des: 查询全部案列简要信息
    */
    List<Map> querySimpleCase();

    /**
    * @param: caseId
    * @return: Map
    * @Des: 根据caseId查询案例信息
    */
    Map queryById(@Param("caseId")int caseId);

    /**
    * @param: Case
    * @return: int
    * @Des: 更新案例信息
    */
    int update(Case newcase);

    /**
    * @param: int caseId
    * @return: int
    * @Des: 根据ID删除案例
    */
    int deleteCase(@Param("caseId")int caseId);

    /**
    * @param:
    * @return: List<Map>
    * @Des: 查询3个最新活动案例信息(图片轮播)
    */
    List<Map> queryNewCase();
}
