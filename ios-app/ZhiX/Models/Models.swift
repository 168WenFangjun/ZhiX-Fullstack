import Foundation

struct User: Codable, Identifiable {
    let id: Int
    let email: String
    let username: String
    let role: String
    let isPremium: Bool
}

struct Article: Codable, Identifiable {
    let id: Int
    let title: String
    let content: String
    let authorId: Int
    let isPaid: Bool
    let likes: Int
    let views: Int
    let createdAt: String
    let coverImage: String?
    let summary: String?
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct PaymentResponse: Codable {
    let success: Bool
    let orderId: String?
    let transactionId: String?
    let amount: Double?
    let currency: String?
    let status: String?
    let message: String
    let timestamp: Int?
}
