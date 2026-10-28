package com.example.reliability.service;

import com.example.reliability.model.OrderEvent;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.retrytopic.TopicSuffixingStrategy;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

@Service
public class EventConsumer {
    private final IdempotencyService idempotency;
    private final EventStateService state;

    public EventConsumer(IdempotencyService idempotency, EventStateService state) {
        this.idempotency = idempotency;
        this.state = state;
    }

    @RetryableTopic(
        attempts = "4",
        backoff = @Backoff(delay = 1000, multiplier = 2.0),
        topicSuffixingStrategy = TopicSuffixingStrategy.SUFFIX_WITH_INDEX_VALUE
    )
    @KafkaListener(topics = "orders", groupId = "reliability-group")
    public void consume(OrderEvent event) {
        if (idempotency.alreadyProcessed(event.getEventId())) {
            state.duplicate(event);
            return;
        }

        if ("FAIL".equalsIgnoreCase(event.getStatus())) {
            state.retry(event);
            throw new RuntimeException("Simulated processing failure");
        }

        idempotency.markProcessed(event.getEventId());
        state.processed(event);
    }

    @DltHandler
    public void handleDlt(OrderEvent event) {
        state.failedToDlq(event);
    }
}
