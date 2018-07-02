package com.youzi.website.service.impl;

import com.youzi.website.service.PictureService;
import com.youzi.website.utils.OssUploadUtil;
import com.youzi.website.utils.RandomCodeUtil;
import org.apache.catalina.servlet4preview.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.Part;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Created by @杨健 on 2018/6/28 11:21
 *
 * @Des: PictureService实现类
 */
@Service("pictureService")
public class PictureServiceImpl implements PictureService {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private OssUploadUtil ossUploadUtil;

    @Override
    public Map upload(MultipartFile file) {
        Map result=new HashMap();
        try {
            String pictureUrl=ossUploadUtil.upload(file);
            ArrayList<String> strList=new ArrayList<String>();
            strList.add(pictureUrl);
            result.put("errno",0);
            result.put("data",strList);
        }catch (Exception e){
            e.printStackTrace();
            result.put("errno",1);
            result.put("data",null);
        }
        return result;
    }

    @Override
    public Map editorUpload(HttpServletRequest request) {
        ArrayList<Part> fileArrayList= null;
        Map result=new HashMap();
        ArrayList<String> strList=new ArrayList<String>();
        try {
            fileArrayList = (ArrayList<Part>) request.getParts();
            for (int i=0;i<fileArrayList.size();i++){
                strList.add(ossUploadUtil.uploadPart(fileArrayList.get(i)));
            }
            result.put("errno",0);
            result.put("data",strList);
        } catch (IOException e) {
            e.printStackTrace();
            result.put("errno",1);
            result.put("data",null);
        } catch (ServletException e) {
            e.printStackTrace();
            result.put("errno",1);
            result.put("data",null);
        }
        return result;
    }

    @Override
    public String getCaptcha() {

        try {
            RandomCodeUtil randomCodeUtil = new RandomCodeUtil();
            //获取4位随机字符串
            String randomStr = randomCodeUtil.getStringRandom(4);
            //字符串存入Redis
            stringRedisTemplate.opsForValue().set("captcha", randomStr, 180, TimeUnit.SECONDS);
            //随机字符串转出base64验证码
            String randomBase64Code = randomCodeUtil.imageToBase64(120, 40, randomStr);
            return randomBase64Code;
        }catch (Exception e){
            e.printStackTrace();
            return null;
        }

    }
}
