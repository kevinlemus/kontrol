package com.kontrol.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
@Slf4j
public class DocumentExtractorService {

    public String extractText(MultipartFile file) {
        String filename = file.getOriginalFilename() != null
                ? file.getOriginalFilename().toLowerCase() : "";
        try {
            if (filename.endsWith(".pdf")) {
                return extractPdf(file.getInputStream());
            } else if (filename.endsWith(".docx")) {
                return extractDocx(file.getInputStream());
            } else if (filename.endsWith(".txt") || filename.endsWith(".csv")) {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            } else {
                // Try plain text as fallback
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.error("Failed to extract text from {}: {}", filename, e.getMessage());
            return "";
        }
    }

    private String extractPdf(InputStream is) throws Exception {
        try (PDDocument doc = PDDocument.load(is)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    private String extractDocx(InputStream is) throws Exception {
        try (XWPFDocument doc = new XWPFDocument(is)) {
            StringBuilder sb = new StringBuilder();
            doc.getParagraphs().forEach(p -> {
                String text = p.getText();
                if (text != null && !text.isBlank()) sb.append(text).append("\n");
            });
            return sb.toString();
        }
    }
}
