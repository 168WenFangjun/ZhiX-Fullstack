import Foundation
import Network
import Combine

class NetworkManager: ObservableObject {
    static let shared = NetworkManager()
    
    @Published var isConnected: Bool = true
    @Published var connectionType: ConnectionType = .wifi
    @Published var connectionQuality: ConnectionQuality = .excellent
    
    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "club.zhix.networkMonitor")
    private var retryAttempts: [String: Int] = [:]
    private let maxRetryAttempts = AppConfig.maxRetryAttempts
    private var connectionHistory: [ConnectionEvent] = []
    
    enum ConnectionType {
        case wifi
        case cellular
        case ethernet
        case unknown
    }
    
    enum ConnectionQuality {
        case excellent
        case good
        case fair
        case poor
    }
    
    struct ConnectionEvent {
        let timestamp: Date
        let isConnected: Bool
        let type: ConnectionType
    }
    
    init() {
        startMonitoring()
    }
    
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.handlePathUpdate(path)
            }
        }
        monitor.start(queue: queue)
    }
    
    private func handlePathUpdate(_ path: NWPath) {
        let wasConnected = isConnected
        isConnected = path.status == .satisfied
        updateConnectionType(path: path)
        
        let event = ConnectionEvent(
            timestamp: Date(),
            isConnected: isConnected,
            type: connectionType
        )
        connectionHistory.append(event)
        
        if connectionHistory.count > 100 {
            connectionHistory.removeFirst()
        }
        
        if wasConnected != isConnected {
        }
        
        Task {
            await checkConnectionQuality()
        }
    }
    
    private func updateConnectionType(path: NWPath) {
        if path.usesInterfaceType(.wifi) {
            connectionType = .wifi
        } else if path.usesInterfaceType(.cellular) {
            connectionType = .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            connectionType = .ethernet
        } else {
            connectionType = .unknown
        }
    }
    
    private func checkConnectionQuality() async {
        guard isConnected else {
            await MainActor.run {
                connectionQuality = .poor
            }
            return
        }
        
        let latency = await measureLatency()
        
        await MainActor.run {
            if latency < 0.05 {
                connectionQuality = .excellent
            } else if latency < 0.15 {
                connectionQuality = .good
            } else if latency < 0.3 {
                connectionQuality = .fair
            } else {
                connectionQuality = .poor
            }
        }
    }
    
    private func measureLatency() async -> TimeInterval {
        let startTime = Date()
        
        do {
            let url = URL(string: "\(AppConfig.apiBaseURL)/health")!
            let (_, _) = try await URLSession.shared.data(from: url)
            return Date().timeIntervalSince(startTime)
        } catch {
            return 999.0
        }
    }
    
    func executeWithRetry<T>(id: String, maxAttempts: Int? = nil, operation: @escaping () async throws -> T) async throws -> T {
        let attempts = maxAttempts ?? maxRetryAttempts
        var lastError: Error?
        
        for attempt in 1...attempts {
            if !isConnected {
                try await waitForConnection()
            }
            
            do {
                let result = try await operation()
                retryAttempts[id] = 0
                return result
            } catch {
                lastError = error
                retryAttempts[id] = attempt
                
                if attempt < attempts {
                    let delay = calculateBackoff(attempt: attempt)
                    try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    
                    if !isConnected {
                        try await waitForConnection()
                    }
                }
            }
        }
        
        throw lastError ?? NetworkError.maxRetriesExceeded
    }
    
    private func calculateBackoff(attempt: Int) -> TimeInterval {
        let baseDelay = pow(2.0, Double(attempt))
        let jitter = Double.random(in: 0...0.5)
        return min(baseDelay + jitter, 10.0)
    }
    
    private func waitForConnection() async throws {
        let timeout: TimeInterval = 30
        let startTime = Date()
        
        while !isConnected {
            if Date().timeIntervalSince(startTime) > timeout {
                throw NetworkError.connectionTimeout
            }
            try await Task.sleep(nanoseconds: 500_000_000)
        }
    }
    
    func getNetworkStats() -> NetworkStats {
        let uptime = calculateUptime()
        let reconnections = countReconnections()
        
        return NetworkStats(
            isConnected: isConnected,
            connectionType: connectionType,
            connectionQuality: connectionQuality,
            uptime: uptime,
            reconnections: reconnections
        )
    }
    
    private func calculateUptime() -> TimeInterval {
        guard let firstEvent = connectionHistory.first else { return 0 }
        return Date().timeIntervalSince(firstEvent.timestamp)
    }
    
    private func countReconnections() -> Int {
        var count = 0
        for i in 1..<connectionHistory.count {
            if !connectionHistory[i-1].isConnected && connectionHistory[i].isConnected {
                count += 1
            }
        }
        return count
    }
    
    func stopMonitoring() {
        monitor.cancel()
    }
}

struct NetworkStats {
    let isConnected: Bool
    let connectionType: NetworkManager.ConnectionType
    let connectionQuality: NetworkManager.ConnectionQuality
    let uptime: TimeInterval
    let reconnections: Int
}

enum NetworkError: Error {
    case notConnected
    case connectionTimeout
    case maxRetriesExceeded
    case poorConnection
}
