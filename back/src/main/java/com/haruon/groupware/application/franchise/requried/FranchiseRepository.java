package com.haruon.groupware.application.franchise.requried;

import com.haruon.groupware.domain.franchise.Franchise;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface FranchiseRepository extends Repository<Franchise, Long>  {

    Franchise save(Franchise franchise);

    Optional<Franchise> findById(long attr0);

    void deleteAll();
}
