import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Last updated: January 15, 2025
          </p>
        </div>

        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-8 prose prose-gray max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using What'sYour.Info ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  What'sYour.Info is a digital identity platform that allows users to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Create and manage public profile pages</li>
                  <li>Use their profile as a unified digital identity</li>
                  <li>Access developer APIs for authentication and profile data</li>
                  <li>Integrate with third-party applications through OAuth</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To use certain features of the Service, you must register for an account. You agree to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Upload, post, or transmit any content that is unlawful, harmful, or offensive</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Interfere with or disrupt the Service or servers</li>
                  <li>Attempt to gain unauthorized access to any part of the Service</li>
                  <li>Use the Service for any commercial purpose without our consent</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Intellectual Property</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  You retain ownership of content you submit to the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute your content in connection with the Service.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The Service and its original content, features, and functionality are owned by DishIs Technologies and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Paid Services</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Some features of the Service require payment ("Pro Features"). By purchasing Pro Features:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>You agree to pay all fees associated with your selected plan</li>
                  <li>Fees are billed in advance and are non-refundable</li>
                  <li>We may change our fees with 30 days' notice</li>
                  <li>You can cancel your subscription at any time</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. API Terms</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you use our API services:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>You must comply with our API documentation and rate limits</li>
                  <li>You are responsible for securing your API keys</li>
                  <li>We may suspend API access for violations of these terms</li>
                  <li>API availability is not guaranteed and may change</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers</h2>
                <p className="text-gray-700 leading-relaxed">
                  The Service is provided "as is" and "as available" without any warranties of any kind. We disclaim all warranties, express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
                <p className="text-gray-700 leading-relaxed">
                  In no event shall DishIs Technologies be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>DishIs Technologies</strong><br />
                    Email: legal@whatsyour.info<br />
                    Address: 123 Tech Street, Suite 100, San Francisco, CA 94105
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}