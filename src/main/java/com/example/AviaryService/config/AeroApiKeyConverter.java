package com.example.AviaryService.config;

import com.example.AviaryService.util.CryptoUtil;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class AeroApiKeyConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null || attribute.isEmpty()) return attribute;
        return CryptoUtil.encrypt(attribute, AeroKeyHolder.get());
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isEmpty()) return dbData;
        return CryptoUtil.decrypt(dbData, AeroKeyHolder.get());
    }
}
