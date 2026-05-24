package com.kontrol.repository;

import com.kontrol.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByActiveTrue();
    List<Project> findAllByOrderByCreatedAtDesc();
}
