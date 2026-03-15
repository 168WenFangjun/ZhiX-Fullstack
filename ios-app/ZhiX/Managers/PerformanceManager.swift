import Foundation
import Combine

class PerformanceManager: ObservableObject {
    static let shared = PerformanceManager()
    
    @Published var metrics: PerformanceMetrics = PerformanceMetrics()
    @Published var healthStatus: HealthStatus = .healthy
    
    private var requestQueue = DispatchQueue(label: "club.zhix.requestQueue", qos: AppConfig.requestQueuePriority, attributes: .concurrent)
    private var activeRequests: Set<String> = []
    private let maxConcurrentRequests = AppConfig.maxConcurrentRequests
    private var requestSemaphore: DispatchSemaphore
    private var metricsTimer: Timer?
    
    enum HealthStatus {
        case healthy
        case degraded
        case critical
    }
    
    init() {
        requestSemaphore = DispatchSemaphore(value: maxConcurrentRequests)
        startMonitoring()
    }
    
    func trackRequest<T>(id: String, operation: @escaping () async throws -> T) async throws -> T {
        guard !activeRequests.contains(id) else {
            if let cached = getCachedResult(id: id) as? T {
                await MainActor.run {
                    metrics.recordCacheHit()
                }
                return cached
            }
            throw PerformanceError.duplicateRequest
        }
        
        requestSemaphore.wait()
        defer { requestSemaphore.signal() }
        
        activeRequests.insert(id)
        defer { activeRequests.remove(id) }
        
        let startTime = Date()
        
        do {
            let result = try await operation()
            let duration = Date().timeIntervalSince(startTime)
            
            await MainActor.run {
                metrics.recordRequest(duration: duration, success: true)
                updateHealthStatus()
            }
            
            cacheResult(id: id, result: result)
            
            return result
        } catch {
            let duration = Date().timeIntervalSince(startTime)
            
            await MainActor.run {
                metrics.recordRequest(duration: duration, success: false)
                updateHealthStatus()
            }
            
            throw error
        }
    }
    
    func batchRequests<T>(_ operations: [(id: String, operation: () async throws -> T)]) async throws -> [T] {
        return try await withThrowingTaskGroup(of: (Int, T).self) { group in
            for (index, op) in operations.enumerated() {
                group.addTask {
                    let result = try await self.trackRequest(id: op.id, operation: op.operation)
                    return (index, result)
                }
            }
            
            var results: [(Int, T)] = []
            for try await result in group {
                results.append(result)
            }
            
            return results.sorted { $0.0 < $1.0 }.map { $0.1 }
        }
    }
    
    private func startMonitoring() {
        guard AppConfig.enablePerformanceMonitoring else { return }
        
        metricsTimer = Timer.scheduledTimer(withTimeInterval: AppConfig.metricsReportingInterval, repeats: true) { [weak self] _ in
            self?.checkMemoryPressure()
        }
    }
    
    private func updateHealthStatus() {
        let successRate = metrics.successRate
        let avgResponseTime = metrics.averageResponseTime
        
        if successRate < 0.95 || avgResponseTime > 1.0 {
            healthStatus = .critical
        } else if successRate < 0.99 || avgResponseTime > 0.5 {
            healthStatus = .degraded
        } else {
            healthStatus = .healthy
        }
    }
    
    private func checkMemoryPressure() {
        let memoryUsage = getMemoryUsage()
        if memoryUsage > 150 {
            CacheManager.shared.clearAll()
        }
    }
    
    private func getMemoryUsage() -> Double {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4
        
        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        
        if kerr == KERN_SUCCESS {
            return Double(info.resident_size) / 1024.0 / 1024.0
        }
        return 0
    }
    
    private func getCPUUsage() -> Double {
        var totalUsageOfCPU: Double = 0.0
        var threadsList: thread_act_array_t?
        var threadsCount = mach_msg_type_number_t(0)
        
        let threadsResult = task_threads(mach_task_self_, &threadsList, &threadsCount)
        
        if threadsResult == KERN_SUCCESS, let threadsList = threadsList {
            for index in 0..<threadsCount {
                var threadInfo = thread_basic_info()
                var threadInfoCount = mach_msg_type_number_t(THREAD_INFO_MAX)
                
                let infoResult = withUnsafeMutablePointer(to: &threadInfo) {
                    $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                        thread_info(threadsList[Int(index)], thread_flavor_t(THREAD_BASIC_INFO), $0, &threadInfoCount)
                    }
                }
                
                if infoResult == KERN_SUCCESS {
                    let threadBasicInfo = threadInfo as thread_basic_info
                    if threadBasicInfo.flags & TH_FLAGS_IDLE == 0 {
                        totalUsageOfCPU += Double(threadBasicInfo.cpu_usage) / Double(TH_USAGE_SCALE) * 100.0
                    }
                }
            }
            
            vm_deallocate(mach_task_self_, vm_address_t(UInt(bitPattern: threadsList)), vm_size_t(Int(threadsCount) * MemoryLayout<thread_t>.stride))
        }
        
        return totalUsageOfCPU
    }
    
    private func cacheResult(id: String, result: Any) {
        CacheManager.shared.set(result, forKey: "request_\(id)", expiration: AppConfig.cacheExpiration)
    }
    
    private func getCachedResult(id: String) -> Any? {
        return CacheManager.shared.get(forKey: "request_\(id)", as: Data.self)
    }
}

struct PerformanceMetrics {
    var totalRequests: Int = 0
    var successfulRequests: Int = 0
    var failedRequests: Int = 0
    var cacheHits: Int = 0
    var totalResponseTime: TimeInterval = 0
    var responseTimes: [TimeInterval] = []
    
    var successRate: Double {
        guard totalRequests > 0 else { return 1.0 }
        return Double(successfulRequests) / Double(totalRequests)
    }
    
    var cacheHitRate: Double {
        guard totalRequests > 0 else { return 0.0 }
        return Double(cacheHits) / Double(totalRequests)
    }
    
    var averageResponseTime: TimeInterval {
        guard totalRequests > 0 else { return 0 }
        return totalResponseTime / Double(totalRequests)
    }
    
    var p95ResponseTime: TimeInterval {
        guard !responseTimes.isEmpty else { return 0 }
        let sorted = responseTimes.sorted()
        let index = Int(Double(sorted.count) * 0.95)
        return sorted[min(index, sorted.count - 1)]
    }
    
    var p99ResponseTime: TimeInterval {
        guard !responseTimes.isEmpty else { return 0 }
        let sorted = responseTimes.sorted()
        let index = Int(Double(sorted.count) * 0.99)
        return sorted[min(index, sorted.count - 1)]
    }
    
    mutating func recordRequest(duration: TimeInterval, success: Bool) {
        totalRequests += 1
        totalResponseTime += duration
        responseTimes.append(duration)
        
        if responseTimes.count > 1000 {
            responseTimes.removeFirst()
        }
        
        if success {
            successfulRequests += 1
        } else {
            failedRequests += 1
        }
    }
    
    mutating func recordCacheHit() {
        cacheHits += 1
    }
}

enum PerformanceError: Error {
    case duplicateRequest
    case timeout
    case memoryWarning
    case tooManyConcurrentRequests
}
