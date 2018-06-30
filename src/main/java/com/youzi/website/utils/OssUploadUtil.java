package com.youzi.website.utils;

import com.aliyun.oss.OSSClient;
import com.aliyun.oss.model.ObjectMetadata;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import javax.servlet.http.Part;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

/**
 * Created by @杨健 on 2018/6/28 11:26
 *
 * @Des: 阿里OSS文件上传工具类
 */
@Component("ossUploadUtil")
public class OssUploadUtil {
    // endpoint以杭州为例，其它region请按实际情况填写，这里用的是ECS内网
    @Value("${oss.endpoint}")
    private String ENDPOINT;
    //生成的图片URL拼接的endpoint
    @Value("${oss.endpoint_url}")
    private String ENDPOINT_URL;
    // 云账号AccessKey有所有API访问权限，建议遵循阿里云安全最佳实践，创建并使用RAM子账号进行API访问或日常运维，请登录 https://ram.console.aliyun.com 创建
    @Value("${oss.accessKeyId}")
    private String ACCESS_KEY_ID;
    @Value("${oss.accessKeySecret}")
    private String ACCESS_KEY_SECRET;
    //Bucket名
    @Value("${oss.bucketName}")
    private String BUCKET_NAME;
    @Value("${oss.maxFileSize}")
    private long MAX_FILE_SIZE;
    @Value("${oss.urlPrefix}")
    private String URL_PREFIX;

    public String upload(MultipartFile file) throws IOException {
        // 创建OSSClient实例
        OSSClient ossClient = new OSSClient(ENDPOINT, ACCESS_KEY_ID, ACCESS_KEY_SECRET);
        String type = file.getContentType();
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentType(type);
        // 上传
        String keyName = UUID.randomUUID().toString();
        InputStream fileContent = file.getInputStream();
        ossClient.putObject(BUCKET_NAME, keyName, fileContent, meta);
        // 关闭client
        ossClient.shutdown();

        //构建图片信息
        String pictureUrl = URL_PREFIX+BUCKET_NAME + "." + ENDPOINT_URL + "/" + keyName;

        return pictureUrl;
    }

    public String uploadPart(Part file) throws IOException {
        // 创建OSSClient实例
        OSSClient ossClient = new OSSClient(ENDPOINT, ACCESS_KEY_ID, ACCESS_KEY_SECRET);
        String type = file.getContentType();
        ObjectMetadata meta = new ObjectMetadata();
        meta.setContentType(type);
        // 上传
        String keyName = UUID.randomUUID().toString();
        InputStream fileContent = file.getInputStream();
        ossClient.putObject(BUCKET_NAME, keyName, fileContent, meta);
        // 关闭client
        ossClient.shutdown();

        //构建图片信息
        String pictureUrl = URL_PREFIX+BUCKET_NAME + "." + ENDPOINT_URL + "/" + keyName;

        return pictureUrl;
    }
}
