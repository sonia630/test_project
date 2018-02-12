package springboot.main.demoDB.controller;

import springboot.main.demoDB.domain.Girl;
import com.demoDB.repository.GirlRepository;
import springboot.main.demoDB.service.GirlService;
import springboot.main.demoDB.utils.ResultUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
public class GirlController {
    @Autowired
    private GirlRepository girlRepository;

    @Autowired
    private GirlService girlService;


    @GetMapping(value = "/girls")
    public List<Girl> girlList(){
        System.out.print("get all girl");
        return girlRepository.findAll();
    }

    @PostMapping(value = "/girls")
    public Object girlAdd(@Valid Girl girl, BindingResult bingingResult){
        if(bingingResult.hasErrors()){
            //error message
           /* Result result = new Result();
            result.setCode(1);
            result.setMsg(bingingResult.getFieldError().getDefaultMessage());*/



            System.out.print(bingingResult.getFieldError().getDefaultMessage());
            return ResultUtil.error(0,bingingResult.getFieldError().getDefaultMessage());
        }

        girl.setAge(girl.getAge());
        girl.setName(girl.getName());


        /*Result result = new Result();
        result.setCode(0);
        result.setMsg("success");
        result.setData(girlRepository.save(girl));*/

        return ResultUtil.success(girlRepository.save(girl));

        /**
         * return: {
             "code": 0,
             "msg": "success",
             "data": {
                 "id": 33,
                 "name": "add",
                 "age": 50
             }
         }
         */
    }

    @GetMapping(value = "/girls/{id}")
    public Girl getGirlById(@PathVariable("id") Integer id){
        System.out.print("get girl by id ");
        return girlRepository.findOne(id);
    }

    @PutMapping(value = "/girls/{id}")
    public Girl updateGirl(@PathVariable("id") Integer id,@RequestParam(value = "name",required = false,defaultValue = "default") String name,@RequestParam("age") Integer age){
        Girl girl = new Girl();
        girl.setId(id);
        girl.setName(name);
        girl.setAge(age);

        return girlRepository.save(girl);

    }

    @DeleteMapping(value = "/girls/{id}")
    public void deleteGirl(@PathVariable("id") Integer id){

         girlRepository.delete(id);

    }

    @GetMapping(value = "/girls/age/{age}")
    public List<Girl> getGirlByAge(@PathVariable("age") Integer age){
       return girlRepository.findGirlByAge(age);
    }

    @PostMapping(value = "/girls/two")
    public void girlTwo(){
        girlService.insertTwo();
    }


    @GetMapping(value = "/girls/getAge/{id}")
    public void getAge(@PathVariable("id") Integer id) throws Exception{
        girlService.getAge(id);
    }

}
