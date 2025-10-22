import React from "react";

export default function ReturnsAndExchanges() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Returns & Exchanges
        </h1>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">Return Window</h2>
            <p>
              We offer a <strong>1-day return policy</strong> from the date of
              delivery. Please ensure you request a return within 24 hours of
              receiving the product.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Refund Method</h2>
            <p>
              Refunds will be credited to your{" "}
              <strong>VaniSarees wallet</strong>. You can use this wallet
              balance to purchase other products on our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Package Opening Video
            </h2>
            <p>
              A video showing the package being opened at the time of delivery
              is <strong>mandatory</strong> for applying for a refund. This
              ensures the product is returned in its original condition.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Return Process</h2>
            <p>
              The refund will be processed only after we receive the product and
              inspect its condition. The returned product must match the
              condition mentioned in the package opening video.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Return Charges</h2>
            <p>
              Return charges will be <strong>deducted</strong> from your wallet
              refund. The exact charges will depend on the product and delivery
              location.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p>
              For any questions or assistance regarding returns, please reach
              out via
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
