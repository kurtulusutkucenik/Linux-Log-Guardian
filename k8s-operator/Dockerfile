# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod ./
# RUN go mod download # Omitting since we use modules locally, but good practice

COPY main.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o k8s-operator .

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/
COPY --from=builder /app/k8s-operator .

EXPOSE 8082

CMD ["./k8s-operator"]
