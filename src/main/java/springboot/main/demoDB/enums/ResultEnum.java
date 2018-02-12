package springboot.main.demoDB.enums;

/**
 * Created by yongtali on 7/3/17.
 */
public enum  ResultEnum {
    UNKNOW_ERROR(-1,"unknow error"),
    SUCCESS(0,"success"),
    PRIMARY_ERROR(100,"age less than 16"),
    SECOND_ERROR(101,"age lagger than 16");


    private Integer code;
    private String msg;

    ResultEnum(Integer code, String msg) {
        this.code = code;
        this.msg = msg;
    }

    public Integer getCode() {
        return code;
    }

    public String getMsg() {
        return msg;
    }
}
