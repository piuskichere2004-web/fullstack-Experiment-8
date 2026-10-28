# Kafka Reliability System

Student-friendly full-stack lab project demonstrating:
- Retry with exponential backoff
- Dead Letter Queue (DLQ)
- Idempotent event processing
- React frontend
- Spring Boot backend
- Apache Kafka with Docker

## Requirements
- JDK 17+
- Maven
- Node.js 18+
- Docker Desktop

## 1. Start Kafka

From the project root:

docker compose up -d

Check:
docker ps

## 2. Start backend

Open PowerShell:

cd backend
mvn spring-boot:run

Backend:
http://localhost:8080

## 3. Start frontend

Open another PowerShell:

cd frontend
npm install
npm run dev

Open:
http://localhost:5173

## 4. Test success

Use the UI:
Event ID: E101
Order ID: O1001
Status: SUCCESS

The event should become PROCESSED.

## 5. Test retry + DLQ

Use:
Event ID: E102
Order ID: O1002
Status: FAIL

The backend retries with exponential backoff:
1 sec -> 2 sec -> 4 sec

After the attempts are exhausted, the event is sent to the DLT/DLQ handler and appears in the DLQ panel.

## 6. Test idempotency

Send the same successful event twice with the same Event ID.

Example:
E103 / O1003 / SUCCESS

The first event is processed. The second is marked DUPLICATE_IGNORED.

## Important
The in-memory idempotency store is intentionally simple for a lab demonstration. In production, store processed event IDs in a database with a unique constraint.
