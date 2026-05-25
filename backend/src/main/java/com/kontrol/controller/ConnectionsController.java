package com.kontrol.controller;

import com.kontrol.model.GlobalPlatformAccount;
import com.kontrol.model.PlatformConfig;
import com.kontrol.repository.GlobalPlatformAccountRepository;
import com.kontrol.repository.PlatformConfigRepository;
import com.kontrol.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/connections")
@RequiredArgsConstructor
public class ConnectionsController {

    private final PlatformConfigRepository platformConfigRepository;
    private final GlobalPlatformAccountRepository globalPlatformAccountRepository;
    private final JwtUtil jwtUtil;

    /**
     * GET /api/v1/connections
     * Returns connection status for all platforms.
     * ?project_id=... is optional. If provided, project-specific tokens take precedence
     * over global tokens. Response is a list of:
     * { platform, connected, accountHandle }
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getConnections(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @RequestParam(value = "project_id", required = false) String projectId) {

        // Require auth
        String token = jwtUtil.extractBearer(auth);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).build();
        }

        // Collect all global connections
        Map<String, GlobalPlatformAccount> globalMap = new HashMap<>();
        globalPlatformAccountRepository.findAll().forEach(g -> globalMap.put(g.getPlatform(), g));

        // Collect project-specific connections (override global)
        Map<String, PlatformConfig> projectMap = new HashMap<>();
        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID pid = UUID.fromString(projectId);
                platformConfigRepository.findByProjectId(pid).forEach(pc -> projectMap.put(pc.getPlatform(), pc));
            } catch (IllegalArgumentException ignored) {}
        }

        List<Map<String, Object>> result = new ArrayList<>();
        Set<String> allPlatforms = new HashSet<>();
        allPlatforms.addAll(globalMap.keySet());
        allPlatforms.addAll(projectMap.keySet());

        for (String platform : allPlatforms) {
            Map<String, Object> entry = new HashMap<>();
            entry.put("platform", platform);

            PlatformConfig pc = projectMap.get(platform);
            GlobalPlatformAccount ga = globalMap.get(platform);

            boolean connected = false;
            String accountHandle = null;

            if (pc != null && pc.getAccessToken() != null && !pc.getAccessToken().isBlank()) {
                connected = true;
                accountHandle = pc.getAccountId();
            } else if (ga != null && ga.getAccessToken() != null && !ga.getAccessToken().isBlank()) {
                connected = true;
                accountHandle = ga.getAccountId();
            }

            entry.put("connected", connected);
            entry.put("accountHandle", accountHandle);
            result.add(entry);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * DELETE /api/v1/connections/{platform}
     * Removes the stored token for the given platform.
     * ?project_id=... is optional — if provided, removes the project-specific token;
     * if absent, removes the global token.
     */
    @DeleteMapping("/{platform}")
    public ResponseEntity<Void> disconnect(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable String platform,
            @RequestParam(value = "project_id", required = false) String projectId) {

        String token = jwtUtil.extractBearer(auth);
        if (token == null || !jwtUtil.isValid(token)) {
            return ResponseEntity.status(401).build();
        }

        if (projectId != null && !projectId.isBlank()) {
            try {
                UUID pid = UUID.fromString(projectId);
                platformConfigRepository.findByProjectIdAndPlatform(pid, platform.toUpperCase())
                    .ifPresent(pc -> {
                        pc.setAccessToken(null);
                        pc.setRefreshToken(null);
                        pc.setAccountId(null);
                        platformConfigRepository.save(pc);
                    });
            } catch (IllegalArgumentException ignored) {}
        } else {
            globalPlatformAccountRepository.findByPlatform(platform.toUpperCase())
                .ifPresent(ga -> {
                    ga.setAccessToken(null);
                    ga.setRefreshToken(null);
                    ga.setAccountId(null);
                    globalPlatformAccountRepository.save(ga);
                });
        }

        return ResponseEntity.noContent().build();
    }
}
