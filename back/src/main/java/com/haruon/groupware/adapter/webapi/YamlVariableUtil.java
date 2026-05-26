package com.haruon.groupware.adapter.webapi;

import org.springframework.beans.factory.annotation.Value;

public class YamlVariableUtil {

    @Value("${PAGE_SIZE}") public static Integer PAGE_SIZE;
    @Value("${PAGE_GROUP_SIZE}") public static Integer PAGE_GROUP_SIZE;
}
