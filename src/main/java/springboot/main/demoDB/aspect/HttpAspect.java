package springboot.main.demoDB.aspect;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;


@Aspect
@Component
public class HttpAspect {

    private final static Logger logger = LoggerFactory.getLogger(HttpAspect.class);

    //@Before("execution(public * com.demoDB.controller.GirlController.*(..))")

    @Pointcut("execution(public * com.demoDB.controller.GirlController.*(..))")
    public void log(){

    }

    @Before("log()")
    public void doBefore(JoinPoint joinPoint){
        logger.info("111111111");
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes.getRequest();
        //url
        logger.info("url={}",request.getRequestURI());
        //method
        logger.info("method={}",request.getMethod());
        //ip
        logger.info("ip={}",request.getRemoteAddr());
        //class name
        logger.info("class_method={}", joinPoint.getSignature().getDeclaringTypeName()+"."+joinPoint.getSignature().getName());
        //类方法
        logger.info("args={}",joinPoint.getArgs());

    }

   // @After("execution(public * com.demoDB.controller.GirlController.*(..))")
    @After("log()")
    public void doAfter(){
        logger.info("22222");

    }

    //返回的内容
    @AfterReturning(returning = "object" ,pointcut = "log()")   //returning 入参就是object
    public void doAfterReturning(Object object){
        logger.info("response={}",object.toString());
    }





}
