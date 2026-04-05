package com.project.waste.service;

import com.project.waste.dto.AIClassificationResponse;
import com.project.waste.enums.WasteType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
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

    @Value("${gemini.api.key}")
    private String apiKey;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private final RestTemplate restTemplate = new RestTemplate();

    public AIClassificationResponse classifyWaste(String description, String imageData) {
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("YOUR_GEMINI_API_KEY")) {
            return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Lỗi: Chưa cấu hình Gemini API Key trong application.properties");
        }

        String normalizedDescription = description != null && !description.isBlank()
                ? description.trim()
                : "Không có mô tả, hãy ưu tiên nhận diện từ hình ảnh.";

        try {
            String prompt = "Phân loại loại rác sau đây vào một trong các danh mục: ORGANIC, RECYCLABLE, HAZARDOUS, GENERAL, ELECTRONIC. " +
                    "Trả về kết quả theo định dạng: CATEGORY|CONFIDENCE|EXPLANATION. " +
                    "Trong đó: CATEGORY là tên danh mục viết hoa, CONFIDENCE là độ tin cậy (0-1), EXPLANATION là giải thích ngắn gọn bằng tiếng Việt. " +
                    "Ví dụ: ORGANIC|0.95|Đây là vỏ chuối, có thể phân hủy tự nhiên. " +
                    "Mô tả: " + normalizedDescription;

            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, Object>> parts = new ArrayList<>();

            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", prompt);
            parts.add(textPart);

            if (imageData != null && !imageData.isBlank()) {
                Matcher matcher = DATA_URL_PATTERN.matcher(imageData.trim());
                if (matcher.matches()) {
                    Map<String, Object> imagePart = new HashMap<>();
                    Map<String, Object> inlineData = new HashMap<>();
                    inlineData.put("mime_type", matcher.group(1));
                    inlineData.put("data", matcher.group(2));
                    imagePart.put("inline_data", inlineData);
                    parts.add(imagePart);
                } else {
                    textPart.put("text", prompt + ". Tham chiếu hình ảnh: " + imageData.trim());
                }
            }

            content.put("parts", parts);
            contents.add(content);
            requestBody.put("contents", contents);

            String url = GEMINI_API_URL + apiKey;
            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);

            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> contentRes = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> partsRes = (List<Map<String, Object>>) contentRes.get("parts");
                    if (!partsRes.isEmpty()) {
                        String result = (String) partsRes.get(0).get("text");
                        return parseAIResult(result.trim());
                    }
                }
            }

        } catch (Exception e) {
            logger.error("Error calling Gemini API", e);
        }

        return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Không thể xác định loại rác.");
    }

    private AIClassificationResponse parseAIResult(String result) {
        try {
            String[] parts = result.split("\\|");
            if (parts.length >= 3) {
                WasteType type = WasteType.valueOf(parts[0].trim().toUpperCase());
                return new AIClassificationResponse(type, parts[1].trim(), parts[2].trim());
            } else if (parts.length == 1) {
                for (WasteType type : WasteType.values()) {
                    if (result.toUpperCase().contains(type.name())) {
                        return new AIClassificationResponse(type, "0.5", "Kết quả từ AI: " + result);
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to parse AI result: {}", result);
        }
        return new AIClassificationResponse(WasteType.GENERAL, "0.0", "Kết quả không rõ ràng: " + result);
    }
}
