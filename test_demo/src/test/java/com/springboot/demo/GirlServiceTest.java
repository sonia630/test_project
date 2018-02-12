package com.demo;

import com.demoDB.service.GirlService;
import org.junit.Assert;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit4.SpringRunner;

@RunWith(SpringRunner.class) //junit 需要在测试环境中跑
@SpringBootTest //启动spring工程
public class GirlServiceTest {

    @Autowired
    private GirlService girlService;

    public void findOneTest() throws Exception {
        Girl girl = girlService.getAge(1);
        Assert.assertEquals(new Integer(50), girl.getAge());

    }
}
