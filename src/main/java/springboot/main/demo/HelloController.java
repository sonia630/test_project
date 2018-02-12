package springboot.main.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @Autowired
    private GirlProperties girlProperties;

    @Value("${cupSize}")
    private  String cupSize;

    @Value("${age}")
    private Integer age;

    @Value("${content}")
    private String content;


    @RequestMapping(value="/hello",method = RequestMethod.GET)
    public String say(){
//        return cupSize+"--"+age;
        return girlProperties.toString();
    }
}
