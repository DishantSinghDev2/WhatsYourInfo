import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Last updated: January 15, 2025
          </p>
        </div>

        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-8 prose prose-gray max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Information You Provide</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Account information (name, email, username, password)</li>
                  <li>Profile information (bio, social links, contact details)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                  <li>Communications with our support team</li>
                  <li>User-generated content (profile photos, descriptions)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Information We Collect Automatically</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Device information (browser type, operating system, IP address)</li>
                  <li>Log data (access times, error logs, performance metrics)</li>
                  <li>Analytics data (profile views, referrer information)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Create and manage your account and profile</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send you important updates and notifications</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Analyze usage patterns to improve our platform</li>
                  <li>Prevent fraud and ensure platform security</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing and Disclosure</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Public Information</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Your profile information (name, bio, social links, avatar) is public by design and can be viewed by anyone visiting your profile page or accessing our public API.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Third-Party Services</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We may share information with trusted third-party services:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Stripe:</strong> Payment processing (credit card information)</li>
                  <li><strong>Cloudflare:</strong> CDN and security services</li>
                  <li><strong>Google Gemini:</strong> AI-powered profile enhancement</li>
                  <li><strong>Analytics providers:</strong> Usage statistics and performance monitoring</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Legal Requirements</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose your information if required by law, court order, or government request, or to protect our rights, property, or safety.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We implement appropriate security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure password hashing using industry standards</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication for our systems</li>
                  <li>Monitoring for suspicious activities and threats</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Management</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>Update your profile information at any time</li>
                  <li>Control the visibility of your profile information</li>
                  <li>Delete your account and associated data</li>
                  <li>Export your data in a portable format</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">Communication Preferences</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Opt out of marketing communications</li>
                  <li>Control notification settings</li>
                  <li>Manage email preferences in your dashboard</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We retain your information for as long as necessary to provide our services:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Account data: Until you delete your account</li>
                  <li>Profile information: Until you remove it or delete your account</li>
                  <li>Usage logs: Up to 2 years for security and analytics</li>
                  <li>Payment records: As required by law (typically 7 years)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Data Transfers</h2>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies and Tracking</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Maintain your login session</li>
                  <li>Remember your preferences</li>
                  <li>Analyze usage patterns</li>
                  <li>Improve our services</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  You can control cookies through your browser settings, but some features may not work properly if cookies are disabled.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  If you have any questions about this privacy policy or our data practices, please contact us:
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">
                    <strong>DishIs Technologies</strong><br />
                    Email: privacy@whatsyour.info<br />
                    Address: 123 Tech Street, Suite 100, San Francisco, CA 94105<br />
                    Phone: +1 (555) 123-4567
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