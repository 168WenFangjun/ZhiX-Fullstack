import Foundation
import PassKit

class PaymentManager: NSObject, ObservableObject {
    static let shared = PaymentManager()
    
    @Published var paymentStatus: PaymentStatus = .idle
    
    enum PaymentStatus {
        case idle
        case processing
        case success
        case failed(Error)
    }
    
    private var paymentController: PKPaymentAuthorizationController?
    private var completionHandler: ((Bool) -> Void)?
    
    func canMakePayments() -> Bool {
        return PKPaymentAuthorizationController.canMakePayments(usingNetworks: [
            .visa,
            .masterCard,
            .chinaUnionPay,
            .amex,
            .discover
        ])
    }
    
    func canMakePaymentsWithActiveCard() -> Bool {
        return PKPaymentAuthorizationController.canMakePayments()
    }
    
    func startPayment(for article: Article, token: String, completion: @escaping (Bool) -> Void) {
        guard canMakePayments() else {
            paymentStatus = .failed(PaymentError.notSupported)
            completion(false)
            return
        }
        
        self.completionHandler = completion
        
        let request = PKPaymentRequest()
        request.merchantIdentifier = AppConfig.applePayMerchantID
        request.supportedNetworks = [
            .visa,
            .masterCard,
            .chinaUnionPay,
            .amex,
            .discover
        ]
        request.merchantCapabilities = .capability3DS
        request.countryCode = AppConfig.applePayCountryCode
        request.currencyCode = AppConfig.applePayCurrencyCode
        
        let paymentItem = PKPaymentSummaryItem(
            label: article.title,
            amount: NSDecimalNumber(string: "9.99"),
            type: .final
        )
        request.paymentSummaryItems = [paymentItem]
        
        paymentController = PKPaymentAuthorizationController(paymentRequest: request)
        paymentController?.delegate = self
        
        paymentController?.present { [weak self] presented in
            if !presented {
                self?.paymentStatus = .failed(PaymentError.presentationFailed)
                completion(false)
            }
        }
    }
    
    func startMembershipPayment(token: String, completion: @escaping (Bool) -> Void) {
        guard canMakePayments() else {
            paymentStatus = .failed(PaymentError.notSupported)
            completion(false)
            return
        }
        
        self.completionHandler = completion
        
        let request = PKPaymentRequest()
        request.merchantIdentifier = AppConfig.applePayMerchantID
        request.supportedNetworks = [
            .visa,
            .masterCard,
            .chinaUnionPay,
            .amex,
            .discover
        ]
        request.merchantCapabilities = .capability3DS
        request.countryCode = AppConfig.applePayCountryCode
        request.currencyCode = AppConfig.applePayCurrencyCode
        
        let paymentItem = PKPaymentSummaryItem(
            label: "ZhiX会员订阅",
            amount: NSDecimalNumber(string: "39.99"),
            type: .final
        )
        request.paymentSummaryItems = [paymentItem]
        
        paymentController = PKPaymentAuthorizationController(paymentRequest: request)
        paymentController?.delegate = self
        
        paymentController?.present { [weak self] presented in
            if !presented {
                self?.paymentStatus = .failed(PaymentError.presentationFailed)
                completion(false)
            }
        }
    }
}

extension PaymentManager: PKPaymentAuthorizationControllerDelegate {
    func paymentAuthorizationController(
        _ controller: PKPaymentAuthorizationController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        paymentStatus = .processing
        
        Task {
            do {
                let token = AuthManager.shared.token ?? ""
                
                let paymentDataString = payment.token.paymentData.base64EncodedString()
                
                let response = try await APIService.shared.processApplePayPayment(
                    token: token,
                    paymentToken: paymentDataString,
                    amount: 9.99,
                    currency: "CNY"
                )
                
                await MainActor.run {
                    if response.success {
                        self.paymentStatus = .success
                        completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
                        self.completionHandler?(true)
                    } else {
                        self.paymentStatus = .failed(PaymentError.processingFailed)
                        completion(PKPaymentAuthorizationResult(status: .failure, errors: nil))
                        self.completionHandler?(false)
                    }
                }
            } catch {
                await MainActor.run {
                    self.paymentStatus = .failed(error)
                    completion(PKPaymentAuthorizationResult(status: .failure, errors: [error]))
                    self.completionHandler?(false)
                }
            }
        }
    }
    
    func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {
        controller.dismiss()
    }
}

enum PaymentError: Error, LocalizedError {
    case notSupported
    case presentationFailed
    case processingFailed
    
    var errorDescription: String? {
        switch self {
        case .notSupported:
            return "您的设备不支持Apple Pay"
        case .presentationFailed:
            return "无法显示Apple Pay支付界面"
        case .processingFailed:
            return "支付处理失败，请重试"
        }
    }
}
