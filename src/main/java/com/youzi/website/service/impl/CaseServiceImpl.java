package com.youzi.website.service.impl;

import com.youzi.website.domain.dto.CaseDTO;
import com.youzi.website.domain.dto.RespondBody;
import com.youzi.website.domain.entity.Case;
import com.youzi.website.mapper.CaseMapper;
import com.youzi.website.service.CaseService;
import com.youzi.website.utils.RespondBuilder;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * Created by @杨健 on 2018/6/25 19:08
 *
 * @Des: 案例服务实现类
 */
@Service("caseService")
public class CaseServiceImpl implements CaseService{

    @Resource
    private CaseMapper caseMapper;

    @Override
    public List<Map> queryAllCase() {
        List<Map> result=caseMapper.queryAllCase();
        result.get(0).put("isFirst",1);
        return result;
    }

    @Override
    public int insert(CaseDTO caseDTO) {
        Case newCase=new Case();
        newCase.setTitle(caseDTO.getTitle());
        newCase.setCaseImg(caseDTO.getCaseImg());
        newCase.setContent(caseDTO.getContent());
        newCase.setCreateTime(caseDTO.getCreateTime());
        caseMapper.insert(newCase);
        return newCase.getCaseId();
    }

    @Override
    public RespondBody querySimpleCase() {
        RespondBody respondBody;
        try{
            List<Map> data=caseMapper.querySimpleCase();
            respondBody=RespondBuilder.buildNormalResponse(data);
        }catch (Exception e){
            e.printStackTrace();
            respondBody= RespondBuilder.buildErrorResponse(e.getMessage());
        }
        return respondBody;
    }

    @Override
    public Map queryById(int caseId) {
        try{
            return caseMapper.queryById(caseId);
        }catch (Exception e){
            e.printStackTrace();
            return null;
        }

    }

    @Override
    public int update(CaseDTO caseDTO) {
        Case newCase=new Case();
        newCase.setCaseId(caseDTO.getCaseId());
        newCase.setTitle(caseDTO.getTitle());
        newCase.setCaseImg(caseDTO.getCaseImg());
        newCase.setContent(caseDTO.getContent());
        newCase.setCreateTime(caseDTO.getCreateTime());
        return caseMapper.update(newCase);
    }

    @Override
    public int deleteCase(int caseId) {
        return caseMapper.deleteCase(caseId);
    }

    @Override
    public List<Map> queryNewCase() {
        return caseMapper.queryNewCase();
    }
}
