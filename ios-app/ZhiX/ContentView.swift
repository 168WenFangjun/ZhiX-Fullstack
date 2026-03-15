import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        Group {
            if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("首页", systemImage: "house.fill")
                }
            
            ExploreView()
                .tabItem {
                    Label("发现", systemImage: "safari.fill")
                }
            
            FavoritesView()
                .tabItem {
                    Label("收藏", systemImage: "heart.fill")
                }
            
            if authManager.currentUser?.role == "admin" {
                SystemMonitorView()
                    .tabItem {
                        Label("监控", systemImage: "chart.bar.fill")
                    }
            }
            
            ProfileView()
                .tabItem {
                    Label("我的", systemImage: "person.fill")
                }
        }
        .accentColor(Color("Primary"))
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
        .environmentObject(ThemeManager())
}
