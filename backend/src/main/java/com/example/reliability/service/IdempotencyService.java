package com.example.reliability.service;

import org.springframework.stereotype.Service;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IdempotencyService {
    private final Set<String> processed = ConcurrentHashMap.newKeySet();

    public boolean alreadyProcessed(String eventId) {
        return processed.contains(eventId);
    }

    public void markProcessed(String eventId) {
        processed.add(eventId);
    }

    public int count() {
        return processed.size();
    }
}
