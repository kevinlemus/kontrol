package com.kontrol.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kontrol.dto.CreateAdCampaignRequest;
import com.kontrol.dto.UpdateAdCampaignRequest;
import com.kontrol.model.AdCampaign;
import com.kontrol.model.GlobalPlatformAccount;
import com.kontrol.model.Project;
import com.kontrol.repository.AdCampaignRepository;
import com.kontrol.repository.GlobalPlatformAccountRepository;
import com.kontrol.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdCampaignService {

    @Value("${meta.ad.account.id:}")
    private String metaAdAccountId;

    private final AdCampaignRepository adCampaignRepository;
    private final ProjectRepository projectRepository;
    private final GlobalPlatformAccountRepository globalPlatformAccountRepository;
    private final ClaudeService claudeService;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public AdCampaign create(CreateAdCampaignRequest request) {
        UUID projectId = UUID.fromString(request.getProjectId());
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));

        // Claude suggests targeting
        String suggestedTargeting = suggestTargeting(project, request);

        AdCampaign campaign = AdCampaign.builder()
            .projectId(projectId)
            .postPlatformId(request.getPostPlatformId() != null ? UUID.fromString(request.getPostPlatformId()) : null)
            .platform(request.getPlatform())
            .dailyBudget(request.getDailyBudget())
            .durationDays(request.getDurationDays())
            .targeting(suggestedTargeting)
            .status("draft")
            .impressions(0L)
            .clicks(0L)
            .spend(BigDecimal.ZERO)
            .updatedAt(OffsetDateTime.now())
            .build();

        // Attempt Meta API call if configured
        if ("meta".equalsIgnoreCase(request.getPlatform())
                && metaAdAccountId != null && !metaAdAccountId.isBlank()) {
            Optional<GlobalPlatformAccount> fbAccount = globalPlatformAccountRepository
                .findByPlatform("facebook");
            if (fbAccount.isPresent() && fbAccount.get().getAccessToken() != null) {
                try {
                    String platformCampaignId = createMetaCampaign(
                        fbAccount.get().getAccessToken(),
                        project.getName(),
                        request.getDailyBudget()
                    );
                    campaign.setPlatformCampaignId(platformCampaignId);
                    campaign.setStatus("active");
                } catch (Exception e) {
                    log.warn("Meta campaign creation failed, saving as draft: {}", e.getMessage());
                }
            }
        }

        return adCampaignRepository.save(campaign);
    }

    public List<AdCampaign> getByProject(UUID projectId) {
        return adCampaignRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    public AdCampaign update(UUID id, UpdateAdCampaignRequest request) {
        AdCampaign campaign = adCampaignRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        if (request.getStatus() != null) {
            campaign.setStatus(request.getStatus());
        }
        if (request.getDailyBudget() != null) {
            campaign.setDailyBudget(request.getDailyBudget());
        }
        campaign.setUpdatedAt(OffsetDateTime.now());

        // If campaign has a platform ID and is Meta, call Meta API to pause/resume
        if (campaign.getPlatformCampaignId() != null
                && "meta".equalsIgnoreCase(campaign.getPlatform())) {
            Optional<GlobalPlatformAccount> fbAccount = globalPlatformAccountRepository
                .findByPlatform("facebook");
            if (fbAccount.isPresent() && fbAccount.get().getAccessToken() != null) {
                try {
                    updateMetaCampaignStatus(
                        fbAccount.get().getAccessToken(),
                        campaign.getPlatformCampaignId(),
                        request.getStatus()
                    );
                } catch (Exception e) {
                    log.warn("Meta campaign update failed: {}", e.getMessage());
                }
            }
        }

        return adCampaignRepository.save(campaign);
    }

    public Map<String, Object> getPerformance(UUID id) {
        AdCampaign campaign = adCampaignRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        if (campaign.getPlatformCampaignId() != null
                && "meta".equalsIgnoreCase(campaign.getPlatform())) {
            Optional<GlobalPlatformAccount> fbAccount = globalPlatformAccountRepository
                .findByPlatform("facebook");
            if (fbAccount.isPresent() && fbAccount.get().getAccessToken() != null) {
                try {
                    return fetchMetaInsights(
                        fbAccount.get().getAccessToken(),
                        campaign.getPlatformCampaignId()
                    );
                } catch (Exception e) {
                    log.warn("Meta insights fetch failed: {}", e.getMessage());
                }
            }
        }

        // Return stored values
        return Map.of(
            "campaignId", campaign.getId().toString(),
            "status", campaign.getStatus() != null ? campaign.getStatus() : "draft",
            "impressions", campaign.getImpressions() != null ? campaign.getImpressions() : 0L,
            "clicks", campaign.getClicks() != null ? campaign.getClicks() : 0L,
            "spend", campaign.getSpend() != null ? campaign.getSpend() : BigDecimal.ZERO
        );
    }

    private String suggestTargeting(Project project, CreateAdCampaignRequest request) {
        String systemPrompt = "You are a digital advertising expert. Suggest audience targeting for an ad campaign. Return ONLY valid JSON with keys: ageMin, ageMax, location, interests (array). No markdown.";
        StringBuilder userMessage = new StringBuilder();
        userMessage.append("Project: ").append(project.getName()).append("\n");
        if (project.getWhatItIs() != null) userMessage.append("What it is: ").append(project.getWhatItIs()).append("\n");
        if (project.getWhoItsFor() != null) userMessage.append("Audience: ").append(project.getWhoItsFor()).append("\n");
        if (project.getIndustry() != null) userMessage.append("Industry: ").append(project.getIndustry()).append("\n");
        userMessage.append("Platform: ").append(request.getPlatform()).append("\n");
        userMessage.append("Daily budget: $").append(request.getDailyBudget()).append("\n");

        try {
            return claudeService.callClaudeRaw(systemPrompt, userMessage.toString(), 512);
        } catch (Exception e) {
            log.warn("Targeting suggestion failed: {}", e.getMessage());
            return "{\"ageMin\":18,\"ageMax\":45,\"location\":\"United States\",\"interests\":[]}";
        }
    }

    private String createMetaCampaign(String accessToken, String projectName, BigDecimal dailyBudget) {
        Map<String, Object> body = Map.of(
            "name", "Kontrol — " + projectName,
            "objective", "OUTCOME_AWARENESS",
            "status", "ACTIVE",
            "daily_budget", dailyBudget.multiply(BigDecimal.valueOf(100)).longValue(), // cents
            "access_token", accessToken
        );

        String response = webClientBuilder.build().post()
            .uri("https://graph.facebook.com/v18.0/act_" + metaAdAccountId + "/campaigns")
            .bodyValue(body)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        try {
            return objectMapper.readTree(response).path("id").asText();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Meta campaign response: " + e.getMessage(), e);
        }
    }

    private void updateMetaCampaignStatus(String accessToken, String campaignId, String status) {
        String metaStatus = "paused".equalsIgnoreCase(status) ? "PAUSED" : "ACTIVE";
        webClientBuilder.build().post()
            .uri("https://graph.facebook.com/v18.0/" + campaignId)
            .bodyValue(Map.of("status", metaStatus, "access_token", accessToken))
            .retrieve()
            .bodyToMono(String.class)
            .block();
    }

    private Map<String, Object> fetchMetaInsights(String accessToken, String campaignId) {
        String response = webClientBuilder.build().get()
            .uri("https://graph.facebook.com/v18.0/" + campaignId + "/insights?access_token=" + accessToken)
            .retrieve()
            .bodyToMono(String.class)
            .block();
        try {
            JsonNode root = objectMapper.readTree(response);
            JsonNode data = root.path("data");
            if (data.isArray() && data.size() > 0) {
                JsonNode insight = data.get(0);
                return Map.of(
                    "impressions", insight.path("impressions").asLong(0),
                    "clicks", insight.path("clicks").asLong(0),
                    "spend", insight.path("spend").asDouble(0)
                );
            }
        } catch (Exception e) {
            log.warn("Failed to parse Meta insights: {}", e.getMessage());
        }
        return Map.of("impressions", 0, "clicks", 0, "spend", 0);
    }
}
