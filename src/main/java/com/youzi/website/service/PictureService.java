package com.youzi.website.service;

import org.apache.catalina.servlet4preview.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * Created by @杨健 on 2018/6/28 11:19
 *
 * @Des: 图片服务
 */

public interface PictureService {
    /**
    * @param: MultipartFile
    * @return: Map
    * @Des: 调用阿里OSS图片上传
    */
    Map upload( MultipartFile file);

    /**
    * @param: HttpServletRequest request
    * @return: Map
    * @Des: 富文本编辑器的图片上传服务（通过Part上传）
    */
    Map editorUpload(HttpServletRequest request);
}
