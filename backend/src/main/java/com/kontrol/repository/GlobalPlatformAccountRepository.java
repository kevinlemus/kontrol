package com.kontrol.repository;

import com.kontrol.model.GlobalPlatformAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GlobalPlatformAccountRepository extends JpaRepository<GlobalPlatformAccount, UUID> {
    Optional<GlobalPlatformAccount> findByPlatform(String platform);
}
