package com.youzi.website;

import com.youzi.website.utils.MD5;

/**
 * Created by @杨健 on 2018/7/2 15:09
 *
 * @Des:
 */

public class md5Test {
    public static void main(String[] args) {
        String str="luke950103";
        String old=MD5.generate(str);
        System.out.println(old);


    }
}
