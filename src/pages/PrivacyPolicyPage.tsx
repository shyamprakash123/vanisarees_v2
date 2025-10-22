import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Privacy Policy
        </h1>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">
              Information We Collect
            </h2>
            <p>
              We collect personal information necessary to provide our services.
              This includes:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>Name, email address, and contact details</li>
              <li>
                Bank account details for transferring referral or affiliate
                earnings
              </li>
              <li>Wallet information for our affiliate partners</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Use of Information</h2>
            <p>The information collected is used to:</p>
            <ul className="list-disc ml-6 mt-2">
              <li>
                Process and transfer referral amounts to users’ bank accounts
              </li>
              <li>Manage and track affiliate partner wallet balances</li>
              <li>
                Communicate with users regarding their account and transactions
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Sharing of Information
            </h2>
            <p>
              We do not sell or share your personal information with third
              parties except:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>To process payments via our payment partners</li>
              <li>As required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Wallet & Affiliate Information
            </h2>
            <p>
              All referral earnings credited to our affiliate wallet are
              securely stored and can only be used to purchase products or
              transferred to your bank account once you provide verified bank
              details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Data Security</h2>
            <p>
              We take appropriate measures to protect your personal and
              financial information. Bank account details and wallet data are
              stored securely and are only accessible to authorized personnel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p>
              If you have any questions or concerns about your data or privacy,
              please contact us via
              <a
                href="mailto:contact@vanisarees.in"
                className="text-red-600 hover:underline"
              >
                {" "}
                email
              </a>{" "}
              or WhatsApp at
              <a
                href="https://wa.me/919550607240"
                className="text-green-600 hover:underline"
              >
                {" "}
                +91 95506 07240
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
