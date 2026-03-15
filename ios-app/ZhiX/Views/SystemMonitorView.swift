import SwiftUI

struct SystemMonitorView: View {
    @EnvironmentObject var performanceManager: PerformanceManager
    @EnvironmentObject var networkManager: NetworkManager
    @State private var refreshTimer: Timer?
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    healthStatusCard
                    performanceMetricsCard
                    networkStatusCard
                    cacheStatusCard
                }
                .padding()
            }
            .navigationTitle("系统监控")
            .navigationBarTitleDisplayMode(.large)
        }
        .onAppear {
            startRefreshing()
        }
        .onDisappear {
            stopRefreshing()
        }
    }
    
    private var healthStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: healthStatusIcon)
                    .foregroundColor(healthStatusColor)
                    .font(.title2)
                
                Text("系统健康")
                    .font(.headline)
                
                Spacer()
                
                Text(healthStatusText)
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(healthStatusColor.opacity(0.2))
                    .foregroundColor(healthStatusColor)
                    .cornerRadius(12)
            }
            
            Divider()
            
            VStack(spacing: 8) {
                MetricRow(
                    icon: "checkmark.circle.fill",
                    label: "可用性目标",
                    value: String(format: "%.6f%%", AppConfig.targetAvailability * 100),
                    color: .green
                )
                
                MetricRow(
                    icon: "chart.line.uptrend.xyaxis",
                    label: "当前成功率",
                    value: String(format: "%.6f%%", performanceManager.metrics.successRate * 100),
                    color: performanceManager.metrics.successRate >= AppConfig.targetSuccessRate ? .green : .orange
                )
                
                MetricRow(
                    icon: "clock.fill",
                    label: "响应时间目标",
                    value: String(format: "%.0fms", AppConfig.targetResponseTime * 1000),
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    private var performanceMetricsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "speedometer")
                    .foregroundColor(Color(hex: "667eea"))
                    .font(.title2)
                
                Text("性能指标")
                    .font(.headline)
            }
            
            Divider()
            
            VStack(spacing: 8) {
                MetricRow(
                    icon: "number",
                    label: "总请求数",
                    value: "\(performanceManager.metrics.totalRequests)",
                    color: .primary
                )
                
                MetricRow(
                    icon: "checkmark.circle",
                    label: "成功请求",
                    value: "\(performanceManager.metrics.successfulRequests)",
                    color: .green
                )
                
                MetricRow(
                    icon: "xmark.circle",
                    label: "失败请求",
                    value: "\(performanceManager.metrics.failedRequests)",
                    color: .red
                )
                
                MetricRow(
                    icon: "clock",
                    label: "平均响应时间",
                    value: String(format: "%.0fms", performanceManager.metrics.averageResponseTime * 1000),
                    color: responseTimeColor
                )
                
                MetricRow(
                    icon: "chart.bar",
                    label: "P95响应时间",
                    value: String(format: "%.0fms", performanceManager.metrics.p95ResponseTime * 1000),
                    color: .orange
                )
                
                MetricRow(
                    icon: "chart.bar.fill",
                    label: "P99响应时间",
                    value: String(format: "%.0fms", performanceManager.metrics.p99ResponseTime * 1000),
                    color: .red
                )
                
                MetricRow(
                    icon: "tray.fill",
                    label: "缓存命中率",
                    value: String(format: "%.1f%%", performanceManager.metrics.cacheHitRate * 100),
                    color: .purple
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    private var networkStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: networkStatusIcon)
                    .foregroundColor(networkStatusColor)
                    .font(.title2)
                
                Text("网络状态")
                    .font(.headline)
                
                Spacer()
                
                Text(networkStatusText)
                    .font(.caption)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(networkStatusColor.opacity(0.2))
                    .foregroundColor(networkStatusColor)
                    .cornerRadius(12)
            }
            
            Divider()
            
            VStack(spacing: 8) {
                MetricRow(
                    icon: "wifi",
                    label: "连接类型",
                    value: connectionTypeText,
                    color: .blue
                )
                
                MetricRow(
                    icon: "speedometer",
                    label: "连接质量",
                    value: connectionQualityText,
                    color: connectionQualityColor
                )
                
                let stats = networkManager.getNetworkStats()
                
                MetricRow(
                    icon: "clock",
                    label: "运行时间",
                    value: formatUptime(stats.uptime),
                    color: .green
                )
                
                MetricRow(
                    icon: "arrow.clockwise",
                    label: "重连次数",
                    value: "\(stats.reconnections)",
                    color: stats.reconnections > 5 ? .orange : .green
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    private var cacheStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "tray.2.fill")
                    .foregroundColor(Color(hex: "ec4899"))
                    .font(.title2)
                
                Text("缓存状态")
                    .font(.headline)
            }
            
            Divider()
            
            VStack(spacing: 8) {
                MetricRow(
                    icon: "memorychip",
                    label: "内存缓存限制",
                    value: formatBytes(AppConfig.memoryCacheLimit),
                    color: .purple
                )
                
                MetricRow(
                    icon: "internaldrive",
                    label: "磁盘缓存限制",
                    value: formatBytes(AppConfig.diskCacheLimit),
                    color: .indigo
                )
                
                MetricRow(
                    icon: "clock.arrow.circlepath",
                    label: "缓存过期时间",
                    value: "\(Int(AppConfig.cacheExpiration))秒",
                    color: .orange
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(16)
    }
    
    private struct MetricRow: View {
        let icon: String
        let label: String
        let value: String
        let color: Color
        
        var body: some View {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .frame(width: 24)
                
                Text(label)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                Text(value)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
            }
            .font(.subheadline)
        }
    }
    
    private var healthStatusIcon: String {
        switch performanceManager.healthStatus {
        case .healthy: return "checkmark.circle.fill"
        case .degraded: return "exclamationmark.triangle.fill"
        case .critical: return "xmark.circle.fill"
        }
    }
    
    private var healthStatusColor: Color {
        switch performanceManager.healthStatus {
        case .healthy: return .green
        case .degraded: return .orange
        case .critical: return .red
        }
    }
    
    private var healthStatusText: String {
        switch performanceManager.healthStatus {
        case .healthy: return "健康"
        case .degraded: return "降级"
        case .critical: return "严重"
        }
    }
    
    private var responseTimeColor: Color {
        let avgTime = performanceManager.metrics.averageResponseTime
        if avgTime <= AppConfig.targetResponseTime {
            return .green
        } else if avgTime <= AppConfig.targetResponseTime * 2 {
            return .orange
        } else {
            return .red
        }
    }
    
    private var networkStatusIcon: String {
        networkManager.isConnected ? "wifi" : "wifi.slash"
    }
    
    private var networkStatusColor: Color {
        networkManager.isConnected ? .green : .red
    }
    
    private var networkStatusText: String {
        networkManager.isConnected ? "已连接" : "已断开"
    }
    
    private var connectionTypeText: String {
        switch networkManager.connectionType {
        case .wifi: return "Wi-Fi"
        case .cellular: return "蜂窝网络"
        case .ethernet: return "以太网"
        case .unknown: return "未知"
        }
    }
    
    private var connectionQualityText: String {
        switch networkManager.connectionQuality {
        case .excellent: return "优秀"
        case .good: return "良好"
        case .fair: return "一般"
        case .poor: return "较差"
        }
    }
    
    private var connectionQualityColor: Color {
        switch networkManager.connectionQuality {
        case .excellent: return .green
        case .good: return .blue
        case .fair: return .orange
        case .poor: return .red
        }
    }
    
    private func formatUptime(_ uptime: TimeInterval) -> String {
        let hours = Int(uptime) / 3600
        let minutes = (Int(uptime) % 3600) / 60
        let seconds = Int(uptime) % 60
        
        if hours > 0 {
            return String(format: "%d小时%d分", hours, minutes)
        } else if minutes > 0 {
            return String(format: "%d分%d秒", minutes, seconds)
        } else {
            return String(format: "%d秒", seconds)
        }
    }
    
    private func formatBytes(_ bytes: Int) -> String {
        let mb = Double(bytes) / 1024.0 / 1024.0
        return String(format: "%.0fMB", mb)
    }
    
    private func startRefreshing() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { _ in
        }
    }
    
    private func stopRefreshing() {
        refreshTimer?.invalidate()
        refreshTimer = nil
    }
}

#Preview {
    SystemMonitorView()
        .environmentObject(PerformanceManager.shared)
        .environmentObject(NetworkManager.shared)
}
