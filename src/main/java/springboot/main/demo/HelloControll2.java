package springboot.main.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

/**
 * Created by yongtali on 6/26/17.
 */
@RestController
@RequestMapping("girl")
public class HelloControll2 {
    @Autowired
    private GirlProperties girlProperties;


    @RequestMapping(value = {"/hello2","/hi"}, method = RequestMethod.GET)
    public String Say(){
//        return "index";
        return girlProperties.toString();
    }

    @RequestMapping(value = "/hello3/{id}",method = RequestMethod.GET)
    public String getParams(@PathVariable("id") Integer id){
        return "id:"+id;

    }

    @RequestMapping(value = "/hello4",method = RequestMethod.GET)
    public String getParam2(@RequestParam(value = "id",required = false,defaultValue = "0") Integer myId){

        return "id:"+myId;
    }


    @GetMapping(value = "/hello5")
    public String getParam3(@RequestParam(value = "id",required = false,defaultValue = "0") Integer myId){

        return "id:"+myId;
    }

}
