package helloworld;

import org.quartz.*;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;

/**
 * Created by yongtali on 7/25/17.
 */
public class Hellojob implements Job {
    //获取jobDataMap setting方法
    private String message;
    private Float FloatJobData;
    private Double DoubleTriggerValue;


    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setFloatJobData(Float floatJobData) {
        FloatJobData = floatJobData;
    }

    public void setDoubleTriggerValue(Double doubleTriggerValue) {
        DoubleTriggerValue = doubleTriggerValue;
    }

    public void execute(JobExecutionContext context) throws JobExecutionException {
        try {
            Thread.sleep(5000L);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        //打印当前执行时间 格式2017-01-01 01:01:01
        Date date = new Date();
        SimpleDateFormat sf = new SimpleDateFormat("yyy-MM-dd HH:mm:ss");
        System.out.println("Current exec time is: "+ sf.format(date));

        //编写具体的业务逻辑
        // 获取job, trigger参数
        JobKey key = context.getJobDetail().getKey();  //返回 "myJob"

        System.out.println("my name and group are:"+ key.getName()+"."+key.getGroup());

        TriggerKey trKey = context.getTrigger().getKey();

        System.out.println("my trigger name and group are:"+trKey.getName()+"."+trKey.getGroup());
        JobDataMap dataMap = context.getJobDetail().getJobDataMap();
        JobDataMap tdataMap = context.getTrigger().getJobDataMap();

        System.out.println(dataMap.toString());
        System.out.println(tdataMap.toString());


        String jobMsg = dataMap.getString("message");
        Float jobFloatJobData = dataMap.getFloat("FloatJobData");

        String triggerMsg = tdataMap.getString("message");
        Double triggerDoubleTriggerValue = tdataMap.getDouble("DoubleTriggerValue");

        System.out.println(jobMsg);
        System.out.println(jobFloatJobData);
        System.out.println(triggerMsg);
        System.out.println(triggerDoubleTriggerValue);


        //Map 合并获取 当jobDetial与trigger有相同的key的时,trigger会覆盖jobDetail的 value
        JobDataMap mergedJobDataMap= context.getMergedJobDataMap();

        for (Map.Entry<String,Object> entry : mergedJobDataMap.entrySet()){
            System.out.println("key:"+entry.getKey()+"==value=="+entry.getValue().toString());
        }

        //获取jobDataMap setting方法 通过setting 让quartz在实现类的时候反射set方法给 jobDataMap的key赋值
        System.out.println("=============== get jobDataMap from setting ===================");
        System.out.println(message);
        System.out.println(FloatJobData);
        System.out.println(DoubleTriggerValue);

        Trigger currentTrigger = context.getTrigger();
        System.out.println("start time is:"+currentTrigger.getStartTime());
        System.out.println("start time is:"+currentTrigger.getEndTime());

        JobKey jobKey = currentTrigger.getJobKey();
        System.out.println("job key info --"+"jobName:"+jobKey.getName()+"--jobgroup--"+jobKey.getGroup());
    }
}
