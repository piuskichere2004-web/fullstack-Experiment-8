package com.example.reliability.service;

import com.example.reliability.model.OrderEvent;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class EventStateService {
    private final Map<String, Map<String, Object>> events = new ConcurrentHashMap<>();
    private final Map<String, Integer> attempts = new ConcurrentHashMap<>();
    private final List<OrderEvent> dlq = Collections.synchronizedList(new ArrayList<>());

    public void received(OrderEvent e) {
        events.put(e.getEventId(), record(e, "RECEIVED"));
    }

    public void processed(OrderEvent e) {
        events.put(e.getEventId(), record(e, "PROCESSED"));
    }

    public void duplicate(OrderEvent e) {
        events.put(e.getEventId(), record(e, "DUPLICATE_IGNORED"));
    }

    public void retry(OrderEvent e) {
        attempts.merge(e.getEventId(), 1, Integer::sum);
        Map<String,Object> r = record(e, "RETRYING");
        r.put("attempts", attempts.get(e.getEventId()));
        events.put(e.getEventId(), r);
    }

    public void failedToDlq(OrderEvent e) {
        Map<String,Object> r = record(e, "DLQ");
        r.put("attempts", attempts.getOrDefault(e.getEventId(), 0));
        events.put(e.getEventId(), r);
        dlq.removeIf(x -> x.getEventId().equals(e.getEventId()));
        dlq.add(e);
    }

    private Map<String,Object> record(OrderEvent e, String status) {
        Map<String,Object> r = new LinkedHashMap<>();
        r.put("eventId", e.getEventId());
        r.put("orderId", e.getOrderId());
        r.put("status", status);
        r.put("attempts", attempts.getOrDefault(e.getEventId(), 0));
        r.put("time", LocalDateTime.now().toString());
        return r;
    }

    public Map<String,Object> get(String id) {
        return events.get(id);
    }

    public Collection<Map<String,Object>> all() {
        return events.values();
    }

    public List<OrderEvent> dlq() {
        return new ArrayList<>(dlq);
    }
}
