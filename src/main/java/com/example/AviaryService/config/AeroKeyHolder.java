package com.example.AviaryService.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

@Component
public class AeroKeyHolder {

    private static SecretKey key;

    public AeroKeyHolder(@Value("${aviary.aero-api-key.secret}") String secret) {
        byte[] decoded = Base64.getDecoder().decode(secret);
        key = new SecretKeySpec(decoded, "AES");
    }

    static SecretKey get() {
        return key;
    }
}
