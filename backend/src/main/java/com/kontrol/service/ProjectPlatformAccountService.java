package com.kontrol.service;

import com.kontrol.model.ProjectPlatformAccount;
import com.kontrol.repository.ProjectPlatformAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectPlatformAccountService {

    private final ProjectPlatformAccountRepository repo;

    public List<ProjectPlatformAccount> getAccountsForProject(UUID projectId) {
        return repo.findByProjectId(projectId);
    }

    public Optional<ProjectPlatformAccount> getAccountForProject(UUID projectId, String platform) {
        return repo.findByProjectIdAndPlatform(projectId, platform);
    }

    @Transactional
    public ProjectPlatformAccount saveAccountForProject(UUID projectId, String platform,
            String accessToken, String refreshToken, String accountId) {
        ProjectPlatformAccount account = repo.findByProjectIdAndPlatform(projectId, platform)
                .orElseGet(ProjectPlatformAccount::new);
        account.setProjectId(projectId);
        account.setPlatform(platform);
        if (accessToken != null) account.setAccessToken(accessToken);
        if (refreshToken != null) account.setRefreshToken(refreshToken);
        if (accountId != null) account.setAccountId(accountId);
        return repo.save(account);
    }

    @Transactional
    public void removeAccountForProject(UUID projectId, String platform) {
        repo.deleteByProjectIdAndPlatform(projectId, platform);
    }
}
