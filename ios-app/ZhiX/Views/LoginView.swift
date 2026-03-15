import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var isRegistering = false
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "667eea"), Color(hex: "764ba2")],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 32) {
                    Spacer(minLength: 80)
                    
                    logoSection
                    
                    formSection
                    
                    Spacer(minLength: 40)
                }
                .padding(.horizontal, 24)
            }
        }
        .alert("错误", isPresented: $showError) {
            Button("确定", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
    }
    
    var logoSection: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(Color.white.opacity(0.2))
                .frame(width: 100, height: 100)
                .overlay(
                    Text("极")
                        .font(.system(size: 50, weight: .bold))
                        .foregroundColor(.white)
                )
            
            Text("极志社区")
                .font(.system(size: 36, weight: .bold))
                .foregroundColor(.white)
            
            Text("发现精彩，分享智慧")
                .font(.subheadline)
                .foregroundColor(.white.opacity(0.8))
        }
    }
    
    var formSection: some View {
        VStack(spacing: 20) {
            VStack(spacing: 16) {
                if isRegistering {
                    CustomTextField(icon: "person.fill", placeholder: "用户名", text: $username)
                }
                
                CustomTextField(icon: "envelope.fill", placeholder: "邮箱", text: $email)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.emailAddress)
                
                CustomSecureField(icon: "lock.fill", placeholder: "密码", text: $password)
            }
            
            Button(action: handleAuth) {
                HStack {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: Color(hex: "667eea")))
                    } else {
                        Text(isRegistering ? "注册" : "登录")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.white)
                .foregroundColor(Color(hex: "667eea"))
                .cornerRadius(16)
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
            }
            .disabled(isLoading)
            .padding(.top, 8)
            
            Button(action: { isRegistering.toggle() }) {
                Text(isRegistering ? "已有账号？立即登录" : "没有账号？立即注册")
                    .font(.subheadline)
                    .foregroundColor(.white)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.white.opacity(0.15))
                .background(
                    RoundedRectangle(cornerRadius: 24)
                        .fill(.ultraThinMaterial)
                )
        )
    }
    
    func handleAuth() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "请填写所有必填项"
            showError = true
            return
        }
        
        if isRegistering && username.isEmpty {
            errorMessage = "请输入用户名"
            showError = true
            return
        }
        
        isLoading = true
        Task {
            do {
                if isRegistering {
                    try await authManager.register(email: email, password: password, username: username)
                } else {
                    try await authManager.login(email: email, password: password)
                }
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isLoading = false
        }
    }
}

struct CustomTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.white.opacity(0.7))
                .frame(width: 20)
            
            TextField(placeholder, text: $text)
                .foregroundColor(.white)
                .accentColor(.white)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.2))
        )
    }
}

struct CustomSecureField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.white.opacity(0.7))
                .frame(width: 20)
            
            SecureField(placeholder, text: $text)
                .foregroundColor(.white)
                .accentColor(.white)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.2))
        )
    }
}
