package springboot.main.demoDB.exception;

import springboot.main.demoDB.enums.ResultEnum;

/**
 * 只有继承runtimeexception才可以
 */
public class GirlException extends RuntimeException {
    private Integer code;

    public GirlException(ResultEnum resultEnum) {
        super(resultEnum.getMsg());
        this.code = resultEnum.getCode();
    }

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }
}
