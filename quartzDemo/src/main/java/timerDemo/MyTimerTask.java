package timerDemo;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.TimerTask;

/**
 * Created by yongtali on 7/27/17.
 */
public class MyTimerTask extends TimerTask {
    private String name;

    public MyTimerTask(String inputName){
        name = inputName;
    }

    private int count = 0;

    @Override
    public void run() {
        if(count < 5){
            //打印
            Calendar calendar = Calendar.getInstance();
            SimpleDateFormat format = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
            System.out.println("current exec time is:" + format.format(calendar.getTime()));

            System.out.println("current exec name is:"+name);





        }else{
            cancel();
            System.out.printf("task cancel!");
        }

        count++;

    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
