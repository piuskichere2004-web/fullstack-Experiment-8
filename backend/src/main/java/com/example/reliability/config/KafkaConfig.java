package com.example.reliability.config;

import com.example.reliability.model.OrderEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.kafka.core.*;

@Configuration
public class KafkaConfig {
    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name("orders").partitions(1).replicas(1).build();
    }

    @Bean
    public ProducerFactory<String, OrderEvent> producerFactory() {
        return new DefaultKafkaProducerFactory<>(
            java.util.Map.of(
                "bootstrap.servers", "localhost:9092",
                "key.serializer", StringSerializer.class,
                "value.serializer", JsonSerializer.class
            )
        );
    }

    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    @Bean
    public ConsumerFactory<String, OrderEvent> consumerFactory() {
        JsonDeserializer<OrderEvent> deserializer = new JsonDeserializer<>(OrderEvent.class);
        deserializer.addTrustedPackages("com.example.reliability.model");
        return new DefaultKafkaConsumerFactory<>(
            java.util.Map.of(
                "bootstrap.servers", "localhost:9092",
                "group.id", "reliability-group",
                "auto.offset.reset", "earliest"
            ),
            new StringDeserializer(),
            deserializer
        );
    }
}
