package com.youzi.website.mapper;

import com.youzi.website.domain.entity.Admin;
import org.apache.ibatis.annotations.Param;

/**
 * Created by @杨健 on 2018/7/2 15:49
 *
 * @Des: 管理员Mapper
 */

public interface AdminMapper {
    Admin getByName(@Param("name")String name);
}
