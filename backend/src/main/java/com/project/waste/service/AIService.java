package com.project.waste.service;

import com.project.waste.dto.AIClassificationResponse;
import com.project.waste.enums.WasteType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class AIService {

    private static final Logger logger = LoggerFactory.getLogger(AIService.class);
    private static final Pattern DATA_URL_PATTERN = Pattern.compile("^data:(.+?);base64,(.+)$");

    @Value("${openai.api.key}")
    private String apiKey;

    private final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    private final RestTemplate restTemplate = new RestTemplate();

    public AIClassificationResponse classifyWaste(String description, String imageData) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("YOUR_OPENAI_API_KEY")) {
            return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Lỗi: Chưa cấu hình OpenAI API Key trong application.properties");
        }

        String normalizedDescription = description != null && !description.isBlank()
                ? description.trim()
                : "Không có mô tả, hãy ưu tiên nhận diện từ hình ảnh.";

        try {
            logger.info("Calling OpenAI API for waste classification. Description: {}", normalizedDescription);
            
            String prompt = "Phân loại loại rác sau đây vào một trong các danh mục: ORGANIC, RECYCLABLE, HAZARDOUS, GENERAL, ELECTRONIC. " +
                    "Trả về kết quả theo định dạng duy nhất: CATEGORY|CONFIDENCE|EXPLANATION. " +
                    "Trong đó: CATEGORY là tên danh mục viết hoa, CONFIDENCE là độ tin cậy (0-1), EXPLANATION là giải thích ngắn gọn bằng tiếng Việt. " +
                    "Mô tả: " + normalizedDescription;

            // Xây dựng body cho OpenAI API (GPT-4o)
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "gpt-4o");
            
            List<Map<String, Object>> messages = new ArrayList<>();
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            
            List<Map<String, Object>> contentList = new ArrayList<>();
            
            // Phần văn bản
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("type", "text");
            textPart.put("text", prompt);
            contentList.add(textPart);
            
            // Phần hình ảnh (nếu có)
            if (imageData != null && !imageData.isBlank()) {
                Map<String, Object> imagePart = new HashMap<>();
                imagePart.put("type", "image_url");
                
                Map<String, String> imageUrl = new HashMap<>();
                imageUrl.put("url", imageData.trim()); // OpenAI chấp nhận trực tiếp data URL
                imagePart.put("image_url", imageUrl);
                
                contentList.add(imagePart);
            }
            
            userMessage.put("content", contentList);
            messages.add(userMessage);
            requestBody.put("messages", messages);
            requestBody.put("temperature", 0.3);

            // Cấu hình Header
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            logger.info("Sending request to OpenAI API...");
            
            Map<String, Object> response;
            try {
                response = restTemplate.postForObject(OPENAI_API_URL, entity, Map.class);
            } catch (Exception e) {
                logger.error("Network or API error when calling OpenAI: {}", e.getMessage());
                return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Lỗi kết nối OpenAI: " + e.getMessage());
            }

            if (response != null && response.containsKey("choices")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
                if (!choices.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> firstChoice = choices.get(0);
                    @SuppressWarnings("unchecked")
                    Map<String, Object> messageRes = (Map<String, Object>) firstChoice.get("message");
                    
                    if (messageRes != null && messageRes.containsKey("content")) {
                        String result = messageRes.get("content").toString();
                        logger.info("OpenAI API raw response: {}", result);
                        
                        // Loại bỏ markdown code blocks nếu có
                        String cleanedResult = result.replaceAll("```[a-zA-Z]*\\n?", "").replaceAll("```", "").trim();
                        return parseAIResult(cleanedResult);
                    }
                }
            } else if (response != null && response.containsKey("error")) {
                @SuppressWarnings("unchecked")
                Map<String, Object> errorMap = (Map<String, Object>) response.get("error");
                String errorMsg = errorMap.get("message") != null ? errorMap.get("message").toString() : "Lỗi không xác định từ OpenAI";
                logger.error("OpenAI API returned error: {}", errorMsg);
                return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Lỗi OpenAI: " + errorMsg);
            }

        } catch (Exception e) {
            logger.error("Unexpected error in classifyWaste", e);
            return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Lỗi hệ thống: " + e.getMessage());
        }

        return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Không nhận được phản hồi từ OpenAI.");
    }

    private AIClassificationResponse parseAIResult(String result) {
        try {
            // Tìm kiếm định dạng CATEGORY|CONFIDENCE|EXPLANATION trong chuỗi
            // Đôi khi AI có thể trả về văn bản thừa xung quanh
            Pattern resultPattern = Pattern.compile("(ORGANIC|RECYCLABLE|HAZARDOUS|GENERAL|ELECTRONIC)\\|([0-9.]+)\\|(.*)", Pattern.CASE_INSENSITIVE);
            Matcher matcher = resultPattern.matcher(result);

            if (matcher.find()) {
                WasteType type = WasteType.valueOf(matcher.group(1).trim().toUpperCase());
                String confidence = matcher.group(2).trim();
                String explanation = matcher.group(3).trim();
                return new AIClassificationResponse(type, confidence, explanation);
            }

            // Nếu không khớp định dạng chuẩn, thử tìm từ khóa loại rác
            for (WasteType type : WasteType.values()) {
                if (result.toUpperCase().contains(type.name())) {
                    return new AIClassificationResponse(type, "0.5", "Kết quả từ AI: " + result);
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to parse AI result: {}", result);
        }
        return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Kết quả không rõ ràng: " + result);
    }
}
