package com.kontrol.repository;

import com.kontrol.model.GeneratedImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GeneratedImageRepository extends JpaRepository<GeneratedImage, UUID> {
}
