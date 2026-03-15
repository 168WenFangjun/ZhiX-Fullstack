import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager
    @State private var articles: [Article] = []
    @State private var isLoading = false
    @State private var searchText = ""
    
    var filteredArticles: [Article] {
        if searchText.isEmpty {
            return articles
        }
        return articles.filter { $0.title.localizedCaseInsensitiveContains(searchText) }
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                themeManager.readingMode.backgroundColor
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 0) {
                        headerView
                        
                        if isLoading {
                            ProgressView()
                                .padding(.top, 100)
                        } else {
                            LazyVStack(spacing: 16) {
                                ForEach(filteredArticles) { article in
                                    NavigationLink(destination: ArticleDetailView(article: article)) {
                                        ArticleCard(article: article)
                                    }
                                    .buttonStyle(PlainButtonStyle())
                                }
                            }
                            .padding()
                        }
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .searchable(text: $searchText, prompt: "搜索文章")
        .task {
            await loadArticles()
        }
        .refreshable {
            await loadArticles()
        }
    }
    
    var headerView: some View {
        VStack(spacing: 12) {
            HStack {
                Text("极志社区")
                    .font(.system(size: 32, weight: .bold))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color(hex: "667eea"), Color(hex: "764ba2")],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                
                Spacer()
                
                Menu {
                    ForEach(ThemeManager.ReadingMode.allCases, id: \.self) { mode in
                        Button(mode.rawValue) {
                            themeManager.setReadingMode(mode)
                        }
                    }
                } label: {
                    Image(systemName: "circle.lefthalf.filled")
                        .font(.title2)
                        .foregroundColor(Color(hex: "667eea"))
                }
            }
            .padding(.horizontal)
            .padding(.top, 60)
            
            if let user = authManager.currentUser {
                HStack {
                    Text("欢迎回来，\(user.username)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Spacer()
                    if user.isPremium {
                        Text("会员")
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(LinearGradient(colors: [Color(hex: "f59e0b"), Color(hex: "ec4899")], startPoint: .leading, endPoint: .trailing))
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                }
                .padding(.horizontal)
            }
        }
        .padding(.bottom, 20)
    }
    
    func loadArticles() async {
        isLoading = true
        
        if let cached: [Article] = CacheManager.shared.get(forKey: "articles", as: [Article].self) {
            articles = cached
            isLoading = false
        }
        
        do {
            let fetchedArticles = try await APIService.shared.fetchArticles(token: authManager.token)
            articles = fetchedArticles
            CacheManager.shared.set(fetchedArticles, forKey: "articles", expiration: 300)
        } catch {
        }
        isLoading = false
    }
}

struct ArticleCard: View {
    let article: Article
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let coverImage = article.coverImage {
                AsyncImage(url: URL(string: coverImage)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Rectangle()
                        .fill(LinearGradient(colors: [Color(hex: "667eea").opacity(0.3), Color(hex: "764ba2").opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                }
                .frame(height: 200)
                .clipped()
                .cornerRadius(16)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text(article.title)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    if article.isPaid {
                        Image(systemName: "lock.fill")
                            .foregroundColor(Color(hex: "f59e0b"))
                    }
                }
                
                if let summary = article.summary {
                    Text(summary)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                } else {
                    Text(article.content.prefix(100) + "...")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                HStack(spacing: 16) {
                    Label("\(article.views)", systemImage: "eye")
                    Label("\(article.likes)", systemImage: "heart")
                    Spacer()
                    Text(formatDate(article.createdAt))
                }
                .font(.caption)
                .foregroundColor(.secondary)
            }
            .padding(.horizontal, 4)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(UIColor.secondarySystemBackground))
                .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
        )
    }
    
    func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else { return "" }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "MM-dd"
        return displayFormatter.string(from: date)
    }
}

struct ExploreView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    Text("发现精彩内容")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .padding(.top, 40)
                    
                    Text("即将推出更多功能")
                        .foregroundColor(.secondary)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct FavoritesView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    Text("我的收藏")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .padding(.top, 40)
                    
                    Text("暂无收藏内容")
                        .foregroundColor(.secondary)
                }
            }
            .navigationBarHidden(true)
        }
    }
}

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager
    
    var body: some View {
        NavigationView {
            ZStack {
                themeManager.readingMode.backgroundColor
                    .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        profileHeader
                        
                        settingsSection
                        
                        logoutButton
                    }
                    .padding()
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    var profileHeader: some View {
        VStack(spacing: 16) {
            Circle()
                .fill(LinearGradient(colors: [Color(hex: "667eea"), Color(hex: "764ba2")], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 100, height: 100)
                .overlay(
                    Text(authManager.currentUser?.username.prefix(1).uppercased() ?? "U")
                        .font(.system(size: 40, weight: .bold))
                        .foregroundColor(.white)
                )
            
            if let user = authManager.currentUser {
                Text(user.username)
                    .font(.title2)
                    .fontWeight(.bold)
                
                Text(user.email)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                if user.isPremium {
                    HStack {
                        Image(systemName: "crown.fill")
                        Text("高级会员")
                    }
                    .font(.subheadline)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(LinearGradient(colors: [Color(hex: "f59e0b"), Color(hex: "ec4899")], startPoint: .leading, endPoint: .trailing))
                    .foregroundColor(.white)
                    .cornerRadius(20)
                }
            }
        }
        .padding(.top, 60)
    }
    
    var settingsSection: some View {
        VStack(spacing: 12) {
            SettingRow(icon: "bell.fill", title: "通知设置", color: Color(hex: "ec4899"))
            SettingRow(icon: "lock.fill", title: "隐私设置", color: Color(hex: "667eea"))
            SettingRow(icon: "questionmark.circle.fill", title: "帮助中心", color: Color(hex: "f59e0b"))
        }
    }
    
    var logoutButton: some View {
        Button(action: { authManager.logout() }) {
            Text("退出登录")
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.red.opacity(0.1))
                .foregroundColor(.red)
                .cornerRadius(12)
        }
        .padding(.top, 20)
    }
}

struct SettingRow: View {
    let icon: String
    let title: String
    let color: Color
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 30)
            
            Text(title)
                .foregroundColor(.primary)
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
                .font(.caption)
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
        .cornerRadius(12)
    }
}
