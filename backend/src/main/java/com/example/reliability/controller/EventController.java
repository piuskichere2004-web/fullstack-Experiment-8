package com.example.reliability.controller;

import com.example.reliability.model.OrderEvent;
import com.example.reliability.service.EventProducer;
import com.example.reliability.service.EventStateService;
import com.example.reliability.service.IdempotencyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {
    private final EventProducer producer;
    private final EventStateService state;
    private final IdempotencyService idempotency;

    public EventController(EventProducer producer, EventStateService state, IdempotencyService idempotency) {
        this.producer = producer;
        this.state = state;
        this.idempotency = idempotency;
    }

    @PostMapping("/events")
    public ResponseEntity<Map<String,Object>> send(@Valid @RequestBody OrderEvent event) {
        producer.send(event);
        return ResponseEntity.accepted().body(Map.of(
            "message", "Event sent to Kafka",
            "eventId", event.getEventId()
        ));
    }

    @GetMapping("/events")
    public Collection<Map<String,Object>> events() {
        return state.all();
    }

    @GetMapping("/events/{id}")
    public ResponseEntity<Map<String,Object>> event(@PathVariable String id) {
        Map<String,Object> result = state.get(id);
        return result == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(result);
    }

    @GetMapping("/dlq")
    public List<OrderEvent> dlq() {
        return state.dlq();
    }

    @GetMapping("/status")
    public Map<String,Object> status() {
        return Map.of(
            "service", "Kafka Reliability System",
            "kafkaTopic", "orders",
            "processedUniqueEvents", idempotency.count()
        );
    }
}
