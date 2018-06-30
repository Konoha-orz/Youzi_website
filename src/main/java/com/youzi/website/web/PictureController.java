package com.youzi.website.web;


import com.youzi.website.service.PictureService;
import org.apache.catalina.servlet4preview.http.HttpServletRequest;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.Part;
import java.io.IOException;

import java.util.*;

/**
 * Created by @杨健 on 2018/6/11 16:16
 *
 * @Des: 图片上传Controller
 */
@RestController
public class PictureController {

    @Resource
    private PictureService pictureService;

    /**
    * @param: MultipartFile file
    * @return: Map
    * @Des: 图片上传控制器
    */
    @RequestMapping(value = "/upload",method = RequestMethod.POST)
    public Map upload(@RequestParam(required = false, value = "file") MultipartFile file) {
        return pictureService.upload(file);
    }

    /**
     * @param: HttpServletRequest request
     * @return: Map
     * @Des: 富文本编辑器的图片上传服务（通过Part上传）
     */
    @RequestMapping(value = "/editorUpload",method = RequestMethod.POST)
    public Map upload(HttpServletRequest request){
        return pictureService.editorUpload(request);
    }
}
