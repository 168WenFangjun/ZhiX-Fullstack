import Foundation

class APIService {
    static let shared = APIService()
    private let baseURL = AppConfig.apiBaseURL
    private let paymentURL = AppConfig.paymentAPIURL
    private let session: URLSession
    private let performanceManager = PerformanceManager.shared
    
    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        config.waitsForConnectivity = true
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        config.urlCache = URLCache(memoryCapacity: 50_000_000, diskCapacity: 100_000_000)
        config.httpMaximumConnectionsPerHost = 10
        self.session = URLSession(configuration: config)
    }
    
    func login(email: String, password: String) async throws -> AuthResponse {
        return try await performanceManager.trackRequest(id: "login_\(email)") {
            let url = URL(string: "\(self.baseURL)/auth/login")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(["email": email, "password": password])
            
            let (data, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return try JSONDecoder().decode(AuthResponse.self, from: data)
        }
    }
    
    func register(email: String, password: String, username: String) async throws -> AuthResponse {
        return try await performanceManager.trackRequest(id: "register_\(email)") {
            let url = URL(string: "\(self.baseURL)/auth/register")!
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(["email": email, "password": password, "username": username])
            
            let (data, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return try JSONDecoder().decode(AuthResponse.self, from: data)
        }
    }
    
    func fetchArticles(token: String?) async throws -> [Article] {
        return try await performanceManager.trackRequest(id: "articles_list") {
            var request = URLRequest(url: URL(string: "\(self.baseURL)/articles")!)
            if let token = token {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            let (data, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return try JSONDecoder().decode([Article].self, from: data)
        }
    }
    
    func fetchArticle(id: Int, token: String?) async throws -> Article {
        return try await performanceManager.trackRequest(id: "article_\(id)") {
            var request = URLRequest(url: URL(string: "\(self.baseURL)/articles/\(id)")!)
            if let token = token {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            }
            let (data, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return try JSONDecoder().decode(Article.self, from: data)
        }
    }
    
    func likeArticle(id: Int, token: String) async throws {
        try await performanceManager.trackRequest(id: "like_\(id)") {
            var request = URLRequest(url: URL(string: "\(self.baseURL)/articles/\(id)/like")!)
            request.httpMethod = "POST"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (_, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return ()
        }
    }
    
    func favoriteArticle(id: Int, token: String) async throws {
        try await performanceManager.trackRequest(id: "favorite_\(id)") {
            var request = URLRequest(url: URL(string: "\(self.baseURL)/articles/\(id)/favorite")!)
            request.httpMethod = "POST"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (_, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return ()
        }
    }
    
    func processApplePayPayment(token: String, paymentToken: String, amount: Double, currency: String) async throws -> PaymentResponse {
        return try await performanceManager.trackRequest(id: "payment_applepay") {
            var request = URLRequest(url: URL(string: "\(self.paymentURL)/apple-pay")!)
            request.httpMethod = "POST"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let payload: [String: Any] = [
                "paymentToken": paymentToken,
                "amount": amount,
                "currency": currency,
                "description": "ZhiX Article Purchase"
            ]
            request.httpBody = try JSONSerialization.data(withJSONObject: payload)
            
            let (data, response) = try await self.session.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
                throw APIError.invalidResponse
            }
            return try JSONDecoder().decode(PaymentResponse.self, from: data)
        }
    }
}

enum APIError: Error {
    case invalidResponse
    case networkError
    case decodingError
}
