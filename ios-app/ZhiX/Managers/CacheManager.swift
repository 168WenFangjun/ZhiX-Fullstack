import Foundation

class CacheManager {
    static let shared = CacheManager()
    
    private let cache = NSCache<NSString, CacheItem>()
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    init() {
        cache.countLimit = 100
        cache.totalCostLimit = 50 * 1024 * 1024
        
        let paths = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)
        cacheDirectory = paths[0].appendingPathComponent("ZhiXCache")
        
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    func set<T: Codable>(_ object: T, forKey key: String, expiration: TimeInterval = 3600) {
        let item = CacheItem(object: object, expiration: Date().addingTimeInterval(expiration))
        cache.setObject(item, forKey: key as NSString)
        
        Task {
            await saveToDisk(object, forKey: key)
        }
    }
    
    func get<T: Codable>(forKey key: String, as type: T.Type) -> T? {
        if let item = cache.object(forKey: key as NSString) {
            if item.isExpired {
                cache.removeObject(forKey: key as NSString)
                return nil
            }
            return item.object as? T
        }
        
        return loadFromDisk(forKey: key, as: type)
    }
    
    func remove(forKey key: String) {
        cache.removeObject(forKey: key as NSString)
        let fileURL = cacheDirectory.appendingPathComponent(key)
        try? fileManager.removeItem(at: fileURL)
    }
    
    func clearAll() {
        cache.removeAllObjects()
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }
    
    private func saveToDisk<T: Codable>(_ object: T, forKey key: String) async {
        let fileURL = cacheDirectory.appendingPathComponent(key)
        if let data = try? JSONEncoder().encode(object) {
            try? data.write(to: fileURL)
        }
    }
    
    private func loadFromDisk<T: Codable>(forKey key: String, as type: T.Type) -> T? {
        let fileURL = cacheDirectory.appendingPathComponent(key)
        guard let data = try? Data(contentsOf: fileURL),
              let object = try? JSONDecoder().decode(type, from: data) else {
            return nil
        }
        return object
    }
}

class CacheItem {
    let object: Any
    let expiration: Date
    
    init(object: Any, expiration: Date) {
        self.object = object
        self.expiration = expiration
    }
    
    var isExpired: Bool {
        return Date() > expiration
    }
}
