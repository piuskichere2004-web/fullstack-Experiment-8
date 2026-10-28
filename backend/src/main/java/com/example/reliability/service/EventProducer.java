package com.example.reliability.service;

import com.example.reliability.model.OrderEvent;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class EventProducer {
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;
    private final EventStateService state;

    public EventProducer(KafkaTemplate<String, OrderEvent> kafkaTemplate, EventStateService state) {
        this.kafkaTemplate = kafkaTemplate;
        this.state = state;
    }

    public void send(OrderEvent event) {
        state.received(event);
        kafkaTemplate.send("orders", event.getEventId(), event);
    }
}
