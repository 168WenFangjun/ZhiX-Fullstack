import SwiftUI

@main
struct ZhiXApp: App {
    @StateObject private var authManager = AuthManager()
    @StateObject private var themeManager = ThemeManager()
    @StateObject private var performanceManager = PerformanceManager.shared
    @StateObject private var networkManager = NetworkManager.shared
    
    init() {
        SecurityManager.shared.performSecurityChecks()
        configureAppearance()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(themeManager)
                .environmentObject(performanceManager)
                .environmentObject(networkManager)
                .preferredColorScheme(themeManager.colorScheme)
                .overlay(networkStatusOverlay)
        }
    }
    
    @ViewBuilder
    private var networkStatusOverlay: some View {
        if !networkManager.isConnected {
            VStack {
                HStack {
                    Image(systemName: "wifi.slash")
                    Text("网络已断开")
                }
                .font(.caption)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(Color.red)
                .foregroundColor(.white)
                .cornerRadius(20)
                .padding(.top, 50)
                
                Spacer()
            }
        }
    }
    
    private func configureAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .systemBackground
        appearance.titleTextAttributes = [.foregroundColor: UIColor.label]
        appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.label]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = .systemBackground
        
        UITabBar.appearance().standardAppearance = tabBarAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
    }
}
