package timerDemo;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Timer;

/**
 * Created by yongtali on 7/27/17.
 */
public class MyTimer {
    public static void main(String[] args) throws InterruptedException {

        //1.创建一个timer实例
        Timer timer = new Timer();
        //2.创建一个MyTimerTask实例
        MyTimerTask myTimerTask = new MyTimerTask("No.1");
        //3.通过timer定时定频率调用myTimerTask的业务逻辑
        //即第一次执行是在当前时间的二秒之后,之后每隔一秒钟执行一次
    //    timer.schedule(myTimerTask,2000L,1000L);


        /*
            第一种 用方法 创建 timerTask的实例,在规定时间运行一次
         */
        //获取当前时间,并设置成距离当前时间三秒之后的时间
        Calendar calendar = Calendar.getInstance();
        SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println(format.format(calendar.getTime()));
        calendar.add(Calendar.SECOND,3); //3秒之后

        myTimerTask.setName("schedule1");
       // timer.schedule(myTimerTask,calendar.getTime());

        /*
          第二种 时间等于或超过time时首次执行task,之后每隔period 毫秒重复执行一次task,
         */

        myTimerTask.setName("schedule2");
        //timer.schedule(myTimerTask,calendar.getTime(),2000);

        //第三种 在1秒后执行task
        myTimerTask.setName("schedule3");
//        timer.schedule(myTimerTask,1000);

        //在3秒后执行,每隔2秒执行一次 task
        myTimerTask.setName("schedule4");
//        timer.schedule(myTimerTask,3000,2000);

        myTimerTask.setName("scheduleAtFixedRate1");
//        timer.scheduleAtFixedRate(myTimerTask,calendar.getTime(),2000);

        timer.scheduleAtFixedRate(myTimerTask,2000,2000);
        System.out.println("scheduled time is:"+format.format(myTimerTask.scheduledExecutionTime()));
        System.out.println(timer.purge());
        Thread.sleep(5000);

        myTimerTask.cancel();
        System.out.println(timer.purge());


        timer.cancel();
        System.out.println("task all canceled");

        int taskNum = timer.purge();
        System.out.println(taskNum);



    }
}
