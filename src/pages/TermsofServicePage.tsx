import React from "react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Terms of Service
        </h1>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">Acceptance of Terms</h2>
            <p>
              By accessing or using the Vani Sarees website and services, you
              agree to comply with these Terms of Service. If you do not agree,
              please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Account Registration</h2>
            <p>
              To use certain services, including the referral program and wallet
              features, you may need to create an account and provide accurate
              information. You are responsible for maintaining the
              confidentiality of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Referral Program & Wallet
            </h2>
            <p>
              Users participating in the referral program will earn credits in
              their Vani Sarees wallet.
              <ul className="list-disc ml-6 mt-2">
                <li>
                  Wallet balance can be used to purchase products on the
                  website.
                </li>
                <li>
                  Transfers to bank accounts require providing valid bank
                  account details.
                </li>
                <li>
                  Vani Sarees reserves the right to adjust or revoke wallet
                  credits in case of fraudulent activity.
                </li>
              </ul>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Orders, Shipping, and Returns
            </h2>
            <p>
              By placing an order, you agree to our shipping and return
              policies:
              <ul className="list-disc ml-6 mt-2">
                <li>1-day return policy applies for eligible products.</li>
                <li>
                  Refunds are credited to the Vani Sarees wallet after receiving
                  and inspecting the returned product.
                </li>
                <li>
                  Return charges may apply as specified in the returns policy.
                </li>
                <li>
                  A package opening video at the time of delivery is required
                  for applying for a refund.
                </li>
              </ul>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Prohibited Activities
            </h2>
            <p>
              Users may not engage in activities that:
              <ul className="list-disc ml-6 mt-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Interfere with the operation of the website</li>
                <li>
                  Attempt to manipulate the referral program or wallet system
                </li>
                <li>Use the website for fraudulent purposes</li>
              </ul>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Intellectual Property
            </h2>
            <p>
              All content on the Vani Sarees website, including text, images,
              and logos, is owned by Vani Sarees and protected by intellectual
              property laws. You may not use any content without prior written
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Limitation of Liability
            </h2>
            <p>
              Vani Sarees is not liable for any direct, indirect, or
              consequential damages arising from the use of the website or
              services, including delays, errors, or issues with orders.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Changes to Terms</h2>
            <p>
              Vani Sarees reserves the right to modify these Terms of Service at
              any time. Users will be notified of major changes, and continued
              use of the website constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p>
              For questions regarding these Terms of Service, please contact us
              via
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
