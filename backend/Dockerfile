# 多阶段构建，减小镜像体积
FROM golang:1.23-alpine AS builder

# 安装必要的构建工具
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /build

# 复制依赖文件并下载
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建应用（启用优化和安全编译选项）
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s -X main.Version=${VERSION}" \
    -a -installsuffix cgo -o zhix-backend .

# 最终镜像
FROM alpine:3.19

# 安装运行时依赖
RUN apk --no-cache add ca-certificates tzdata && \
    addgroup -g 1000 app && \
    adduser -D -u 1000 -G app app

WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /build/zhix-backend .
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# 使用非root用户运行
USER app

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["./zhix-backend"]
