import Foundation
import Combine
import Security

class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var token: String?
    
    private let apiService = APIService.shared
    private let keychainService = "club.zhix.app"
    private let keychainAccount = "authToken"
    
    init() {
        loadToken()
    }
    
    func login(email: String, password: String) async throws {
        let response = try await apiService.login(email: email, password: password)
        
        await MainActor.run {
            self.token = response.token
            self.currentUser = response.user
            self.isAuthenticated = true
            saveToken(response.token)
        }
    }
    
    func register(email: String, password: String, username: String) async throws {
        let response = try await apiService.register(email: email, password: password, username: username)
        
        await MainActor.run {
            self.token = response.token
            self.currentUser = response.user
            self.isAuthenticated = true
            saveToken(response.token)
        }
    }
    
    func logout() {
        token = nil
        currentUser = nil
        isAuthenticated = false
        deleteToken()
    }
    
    private func loadToken() {
        if let savedToken = getTokenFromKeychain() {
            token = savedToken
            isAuthenticated = true
        }
    }
    
    private func saveToken(_ token: String) {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        
        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }
    
    private func getTokenFromKeychain() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return token
    }
    
    private func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}
