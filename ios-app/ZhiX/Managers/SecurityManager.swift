import Foundation
import UIKit
import CryptoKit

class SecurityManager {
    static let shared = SecurityManager()
    
    private init() {
        performSecurityChecks()
    }
    
    func performSecurityChecks() {
        if AppConfig.jailbreakDetectionEnabled {
            checkJailbreak()
        }
        checkDebugger()
        validateAppIntegrity()
    }
    
    private func checkJailbreak() {
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/bin/bash",
            "/usr/sbin/sshd",
            "/etc/apt",
            "/private/var/lib/apt/"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                handleSecurityThreat("检测到越狱设备")
                return
            }
        }
        
        let testPath = "/private/jailbreak_test.txt"
        do {
            try "test".write(toFile: testPath, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: testPath)
            handleSecurityThreat("检测到越狱设备")
        } catch {
        }
    }
    
    private func checkDebugger() {
        var info = kinfo_proc()
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        var size = MemoryLayout<kinfo_proc>.stride
        
        let result = sysctl(&mib, UInt32(mib.count), &info, &size, nil, 0)
        
        if result == 0 && (info.kp_proc.p_flag & P_TRACED) != 0 {
            handleSecurityThreat("检测到调试器")
        }
    }
    
    private func validateAppIntegrity() {
        guard let bundlePath = Bundle.main.bundlePath as NSString? else {
            handleSecurityThreat("无法获取Bundle路径")
            return
        }
        
        if !FileManager.default.fileExists(atPath: bundlePath as String) {
            handleSecurityThreat("应用文件被篡改")
        }
    }
    
    func encrypt(data: Data, key: SymmetricKey) throws -> Data {
        let sealedBox = try AES.GCM.seal(data, using: key)
        guard let combined = sealedBox.combined else {
            throw SecurityError.encryptionFailed
        }
        return combined
    }
    
    func decrypt(data: Data, key: SymmetricKey) throws -> Data {
        let sealedBox = try AES.GCM.SealedBox(combined: data)
        return try AES.GCM.open(sealedBox, using: key)
    }
    
    func generateKey() -> SymmetricKey {
        return SymmetricKey(size: .bits256)
    }
    
    func validateServerCertificate(_ challenge: URLAuthenticationChallenge) -> Bool {
        guard AppConfig.certificatePinningEnabled else { return true }
        
        guard let serverTrust = challenge.protectionSpace.serverTrust else {
            return false
        }
        
        guard let certificate = SecTrustGetCertificateAtIndex(serverTrust, 0) else {
            return false
        }
        
        let serverCertificateData = SecCertificateCopyData(certificate) as Data
        
        let serverCertificateHash = SHA256.hash(data: serverCertificateData)
        let serverHashString = serverCertificateHash.compactMap { String(format: "%02x", $0) }.joined()
        
        let expectedHashes = [
            "your_certificate_hash_here"
        ]
        
        return expectedHashes.contains(serverHashString)
    }
    
    func saveToKeychain(data: Data, forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            kSecAttrSynchronizable as String: false
        ]
        
        SecItemDelete(query as CFDictionary)
        let status = SecItemAdd(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    func loadFromKeychain(forKey key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess, let data = result as? Data else {
            return nil
        }
        
        return data
    }
    
    func deleteFromKeychain(forKey key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess
    }
    
    private func handleSecurityThreat(_ message: String) {
    }
}

enum SecurityError: Error {
    case encryptionFailed
    case decryptionFailed
    case jailbroken
    case debuggerDetected
    case integrityViolation
}
