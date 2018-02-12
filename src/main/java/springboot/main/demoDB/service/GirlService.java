package springboot.main.demoDB.service;

import springboot.main.demoDB.domain.Girl;
import springboot.main.demoDB.enums.ResultEnum;
import com.demoDB.exception.GirlException;
import com.demoDB.repository.GirlRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.transaction.Transactional;

@Service
public class GirlService {

    @Autowired
    GirlRepository girlRepository;

    @Transactional
    public void insertTwo(){

        Girl girlA = new Girl();
        girlA.setName("A");
        girlA.setAge(19);
        girlRepository.save(girlA);

        Girl girlB = new Girl();
        girlB.setAge(13);
        girlB.setName("B");
        girlRepository.save(girlB);

    }

    //统一异常处理
    public com.demo.Girl getAge(Integer id) throws Exception{
        Girl girl = girlRepository.findOne(id);
        Integer age = girl.getAge();

        //看成类似表单的验证 code = 100
        if(age < 10){
            throw new GirlException(ResultEnum.PRIMARY_ERROR);//(100,"age less than 10");
        }else if(age > 10 && age <16){
           // code = 101
            throw new GirlException(ResultEnum.SECOND_ERROR);
        }else{
            // code = 101
            throw new GirlException(ResultEnum.UNKNOW_ERROR);
        }
        //if >16 加钱
    }

    public Girl findOne(Integer id){
       return girlRepository.findOne(id);
    }

}
