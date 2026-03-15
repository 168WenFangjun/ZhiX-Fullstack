import Foundation

struct AppConfig {
    #if DEBUG
    static let apiBaseURL = "http://localhost:8080/api"
    static let paymentAPIURL = "http://localhost:8081/api/payment"
    #else
    static let apiBaseURL = "https://api.zhix.club/api"
    static let paymentAPIURL = "https://payment.zhix.club/api/payment"
    #endif
    
    static let apiTimeout: TimeInterval = 30
    static let resourceTimeout: TimeInterval = 300
    
    static let memoryCacheLimit = 50_000_000
    static let diskCacheLimit = 100_000_000
    static let cacheExpiration: TimeInterval = 300
    
    static let maxConcurrentRequests = 20
    static let maxRetryAttempts = 5
    static let requestQueuePriority: DispatchQoS.QoSClass = .userInitiated
    
    static let applePayMerchantID = "merchant.club.zhix"
    static let applePayDisplayName = "ZhiX Club"
    static let applePayCountryCode = "CN"
    static let applePayCurrencyCode = "CNY"
    
    static let appVersion = "2.0"
    static let bundleIdentifier = "club.zhix.app"
    
    static let targetAvailability: Double = 0.99999999
    static let targetResponseTime: TimeInterval = 0.2
    static let targetSuccessRate: Double = 0.99999999
    
    static let minTLSVersion = "TLSv1.3"
    static let certificatePinningEnabled = true
    static let jailbreakDetectionEnabled = true
    
    static let enableImageCompression = true
    static let imageCompressionQuality: CGFloat = 0.8
    static let enableLazyLoading = true
    static let prefetchDistance = 3
    
    static let enablePerformanceMonitoring = true
    static let enableCrashReporting = true
    static let metricsReportingInterval: TimeInterval = 60
}
