import Navbar from '@/components/Navbar'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-heading font-bold text-text-primary mb-2">Terms of Use</h1>
        <p className="text-text-muted text-sm mb-8">Last updated: March 2026</p>

        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          These Terms of Use (&quot;Terms&quot;) govern your access to and use of the Cosmos AI Voice Note Taker application (&quot;Service&quot;), operated by Zama Khumalo (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), based in the Republic of South Africa. By creating an account or using the Service, you agree to be bound by these Terms.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">1. Acceptance of Terms</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          By registering for an account or using any part of the Service, you confirm that you are at least 18 years of age and that you accept and agree to be bound by these Terms. If you do not agree, you may not use the Service.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">2. Service Description</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          Cosmos is an AI-powered voice note taker. You record voice notes through your browser, which are transcribed using the Web Speech API. Transcripts are processed by AI (Anthropic Claude) to generate polished text, summaries, action items, key decisions, and tags. Your notes are stored securely and accessible from your account.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">3. Account Responsibilities</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          You are responsible for:
        </p>
        <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 mb-4">
          <li>Providing accurate and complete registration information.</li>
          <li>Maintaining the security and confidentiality of your password.</li>
          <li>All activity that occurs under your account.</li>
          <li>Notifying us immediately if you suspect unauthorised access to your account.</li>
        </ul>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">4. Acceptable Use</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          You agree not to use the Service to:
        </p>
        <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 mb-4">
          <li>Record, store, or process any illegal, harmful, threatening, abusive, or otherwise objectionable content.</li>
          <li>Attempt to abuse, exploit, or circumvent the AI processing features.</li>
          <li>Use automated scripts, bots, or scrapers to access the Service.</li>
          <li>Interfere with or disrupt the Service or its infrastructure.</li>
          <li>Impersonate another person or misrepresent your identity.</li>
          <li>Violate any applicable law or regulation.</li>
        </ul>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">5. Subscription and Billing</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          Cosmos offers the following plans:
        </p>
        <ul className="list-disc list-inside text-text-secondary text-sm space-y-1 mb-4">
          <li><strong className="text-text-primary">Trial:</strong> 7 days free with full features and up to 20 notes. A payment method is required upfront. If not cancelled before the trial ends, your subscription will automatically convert to the Pro plan.</li>
          <li><strong className="text-text-primary">Free:</strong> Limited to 3 notes per month and 5 AI questions per day after the trial expires or is cancelled.</li>
          <li><strong className="text-text-primary">Pro:</strong> R149/month (South African Rand) via PayFast. Unlimited notes and full access to all features.</li>
        </ul>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          You may cancel your Pro subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are provided for partial months. All payments are processed by PayFast and are subject to their terms and conditions.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">6. Intellectual Property</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          You retain full ownership of your notes, transcripts, and any content you create using the Service. We do not claim ownership over your content.
        </p>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          The Cosmos application, including its design, branding, AI processing logic, code, and all associated intellectual property, is owned by us and protected by applicable copyright and intellectual property laws. You may not copy, modify, distribute, or reverse-engineer any part of the Service.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">7. AI-Generated Content Disclaimer</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          Cosmos uses artificial intelligence to generate summaries, action items, key decisions, tags, and other insights from your notes. This AI-generated content is provided for convenience and informational purposes only. It may contain inaccuracies, omissions, or errors. You are responsible for reviewing and verifying any AI-generated content before relying on it for decisions or actions.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">8. Service Availability</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          We strive to keep Cosmos available and reliable, but we do not guarantee uninterrupted or error-free operation. The Service is provided on a &quot;best effort&quot; basis. We may perform maintenance, updates, or experience downtime without prior notice. We are not liable for any loss or inconvenience caused by service interruptions.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">9. Limitation of Liability</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          To the maximum extent permitted by the laws of the Republic of South Africa, Cosmos and its operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of profits, or business interruption, arising out of or related to your use of the Service. Our total liability for any claim shall not exceed the amount you paid us in the 12 months preceding the claim.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">10. Termination</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          We reserve the right to suspend or terminate your account if you violate these Terms or engage in conduct that we reasonably believe is harmful to the Service, other users, or our interests. Upon termination, your right to use the Service ceases immediately. You may request deletion of your data by contacting us.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">11. Governing Law</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          These Terms are governed by and construed in accordance with the laws of the Republic of South Africa. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of the Republic of South Africa.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">12. Changes to These Terms</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          We may update these Terms from time to time. If we make material changes, we will notify you by email at the address associated with your account. Your continued use of the Service after such notification constitutes acceptance of the updated Terms.
        </p>

        <h2 className="text-xl font-heading font-semibold text-text-primary mt-8 mb-3">13. Contact Us</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          If you have any questions about these Terms, please contact:
        </p>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">
          Zama Khumalo<br />
          Email: zamolucas@gmail.com
        </p>
      </main>
    </div>
  )
}
