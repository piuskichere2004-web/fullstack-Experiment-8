package com.example.reliability.model;

import jakarta.validation.constraints.NotBlank;

public class OrderEvent {
    @NotBlank
    private String eventId;
    @NotBlank
    private String orderId;
    @NotBlank
    private String status;

    public OrderEvent() {}

    public OrderEvent(String eventId, String orderId, String status) {
        this.eventId = eventId;
        this.orderId = orderId;
        this.status = status;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
