package helloworld;

import org.quartz.*;
import org.quartz.impl.StdSchedulerFactory;

import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * Created by yongtali on 7/25/17.
 */
public class HelloScheduler {
    public static void main(String[] args) throws SchedulerException, InterruptedException {
        //创建一个jobDetail实例,将该实例与HelloJob class 绑定
        //jobdetail 通过jobbuilder创建 ,
        // withIdentity 在scheduler里面创建一个唯一标识,withIdentity以什么名字,组
        JobDetail jobDetail = JobBuilder
                .newJob(Hellojob.class)
                .usingJobData("message","helloMyJobData1") //usingJobData参数
                .usingJobData("FloatJobData",1.34F)
                .withIdentity("myJob","group1")
                .build();

        //属性
        System.out.println("jobDetai name:"+jobDetail.getKey().getName());
        System.out.println("jobDetai group:"+jobDetail.getKey().getGroup());
        System.out.println("jobDetail jobClass:"+jobDetail.getJobClass());

        //获取当前时间3秒后的时间 执行
        Date startTime = new Date();
        startTime.setTime(startTime.getTime() + 3000);

        //距离6秒后结束
        Date endTime = new Date();
        endTime.setTime(endTime.getTime() + 6000);

/*
        //创建一个trigger实例,触发job执行, 定义该job立即执行,并且每隔二秒重复执行一次
        Trigger trigger = TriggerBuilder.newTrigger() //trigger 是通过 triggerBuilder 创建的
                .withIdentity("myTrigger","group1") //名称与组名
                .usingJobData("message","helloMyTrigger1") //传参数  usingJobData
                .usingJobData("DoubleTriggerValue",2.0D)
               // .startNow() // 立即执行
                .startAt(startTime)  //3秒后执行
                .endAt(endTime)
                .withSchedule(SimpleScheduleBuilder.simpleSchedule().withIntervalInSeconds(2)
                        //.repeatForever() // 永久执行
                        .withRepeatCount(SimpleTrigger.REPEAT_INDEFINITELY) //永久执行
                ) //频率 每隔二秒, 永不间断

                .build(); // 创建
*/

        //每秒钟触发一次
        CronTrigger trigger = (CronTrigger) TriggerBuilder
                .newTrigger()
                .withIdentity("myCronTrigger","group1")
                .withSchedule(CronScheduleBuilder.cronSchedule("* * * * * ? *"))   //? 没用,* 每
                .build();





        //创建Scheduler实例  通过工厂模式创建scheduler
        SchedulerFactory sfact = new StdSchedulerFactory();
        Scheduler scheduler = sfact.getScheduler();

        //开始执行start
        scheduler.start();

        //把jobDetail与trigger绑定在一起
        Date schedulerTime= scheduler.scheduleJob(jobDetail,trigger);
        System.out.println("schedulerTime is:"+schedulerTime);

        //打印当前执行时间 格式2017-01-01 01:01:01
        Date date = new Date();
        SimpleDateFormat sf = new SimpleDateFormat("yyy-MM-dd HH:mm:ss");
        System.out.println("hello scheduler Current exec time is: "+ sf.format(date));

        // scheduler 执行2秒后挂起
        Thread.sleep(2000L);

        //挂起
        scheduler.standby();

        //停止,不能启动
        scheduler.shutdown(false);
        System.out.println("scheduler is shut down?"+scheduler.isShutdown());

        // scheduler 挂起3秒后继续执行再次开始
        Thread.sleep(3000L);
        scheduler.start();


    }
}
