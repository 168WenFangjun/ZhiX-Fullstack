import SwiftUI
import PassKit

struct ArticleDetailView: View {
    let article: Article
    @EnvironmentObject var authManager: AuthManager
    @EnvironmentObject var themeManager: ThemeManager
    @StateObject private var paymentManager = PaymentManager.shared
    @State private var isLiked = false
    @State private var isFavorited = false
    @State private var showPayment = false
    @State private var fullArticle: Article?
    
    var body: some View {
        ZStack {
            themeManager.readingMode.backgroundColor
                .ignoresSafeArea()
            
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    if let coverImage = article.coverImage {
                        AsyncImage(url: URL(string: coverImage)) { image in
                            image
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        } placeholder: {
                            Rectangle()
                                .fill(LinearGradient(colors: [Color(hex: "667eea").opacity(0.3), Color(hex: "764ba2").opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        }
                        .frame(height: 250)
                        .clipped()
                    }
                    
                    VStack(alignment: .leading, spacing: 16) {
                        Text(article.title)
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.primary)
                        
                        HStack {
                            Label("\(article.views)", systemImage: "eye")
                            Label("\(article.likes)", systemImage: "heart")
                            Spacer()
                            Text(formatDate(article.createdAt))
                        }
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        
                        Divider()
                        
                        if article.isPaid && !(authManager.currentUser?.isPremium ?? false) {
                            VStack(spacing: 16) {
                                Text(article.content.prefix(200) + "...")
                                    .font(.body)
                                    .foregroundColor(.primary)
                                
                                VStack(spacing: 12) {
                                    Text("解锁完整内容")
                                        .font(.headline)
                                    
                                    Text("使用 Apple Pay 购买此文章")
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                    
                                    if paymentManager.canMakePayments() {
                                        Button(action: {
                                            paymentManager.startPayment(for: article, token: authManager.token ?? "") { success in
                                                if success {
                                                    loadFullArticle()
                                                }
                                            }
                                        }) {
                                            HStack {
                                                Image(systemName: "apple.logo")
                                                Text("Apple Pay 购买 ¥9.99")
                                            }
                                            .fontWeight(.semibold)
                                            .frame(maxWidth: .infinity)
                                            .padding()
                                            .background(Color.black)
                                            .foregroundColor(.white)
                                            .cornerRadius(12)
                                        }
                                    } else {
                                        Text("此设备不支持 Apple Pay")
                                            .foregroundColor(.red)
                                            .font(.caption)
                                    }
                                }
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(Color(UIColor.secondarySystemBackground))
                                )
                            }
                        } else {
                            Text(fullArticle?.content ?? article.content)
                                .font(.body)
                                .foregroundColor(.primary)
                                .lineSpacing(8)
                        }
                    }
                    .padding()
                    
                    actionButtons
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if !article.isPaid || (authManager.currentUser?.isPremium ?? false) {
                loadFullArticle()
            }
        }
    }
    
    var actionButtons: some View {
        HStack(spacing: 16) {
            Button(action: { toggleLike() }) {
                HStack {
                    Image(systemName: isLiked ? "heart.fill" : "heart")
                    Text("点赞")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(isLiked ? LinearGradient(colors: [Color(hex: "ec4899"), Color(hex: "f59e0b")], startPoint: .leading, endPoint: .trailing) : LinearGradient(colors: [Color.gray.opacity(0.2), Color.gray.opacity(0.2)], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(isLiked ? .white : .primary)
                .cornerRadius(12)
            }
            
            Button(action: { toggleFavorite() }) {
                HStack {
                    Image(systemName: isFavorited ? "star.fill" : "star")
                    Text("收藏")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(isFavorited ? LinearGradient(colors: [Color(hex: "667eea"), Color(hex: "764ba2")], startPoint: .leading, endPoint: .trailing) : LinearGradient(colors: [Color.gray.opacity(0.2), Color.gray.opacity(0.2)], startPoint: .leading, endPoint: .trailing))
                .foregroundColor(isFavorited ? .white : .primary)
                .cornerRadius(12)
            }
        }
        .padding()
    }
    
    func loadFullArticle() {
        Task {
            do {
                let article = try await APIService.shared.fetchArticle(id: self.article.id, token: authManager.token)
                fullArticle = article
            } catch {
            }
        }
    }
    
    func toggleLike() {
        guard let token = authManager.token else { return }
        isLiked.toggle()
        
        Task {
            do {
                try await APIService.shared.likeArticle(id: article.id, token: token)
            } catch {
                isLiked.toggle()
            }
        }
    }
    
    func toggleFavorite() {
        guard let token = authManager.token else { return }
        isFavorited.toggle()
        
        Task {
            do {
                try await APIService.shared.favoriteArticle(id: article.id, token: token)
            } catch {
                isFavorited.toggle()
            }
        }
    }
    
    func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: dateString) else { return "" }
        
        let displayFormatter = DateFormatter()
        displayFormatter.dateFormat = "yyyy年MM月dd日"
        return displayFormatter.string(from: date)
    }
}
