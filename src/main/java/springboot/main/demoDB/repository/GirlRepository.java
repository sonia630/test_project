package springboot.main.demoDB.repository;

import springboot.main.demoDB.domain.Girl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;


public interface GirlRepository extends JpaRepository<Girl,Integer> {
    public List<Girl> findGirlByAge(Integer age);
}
