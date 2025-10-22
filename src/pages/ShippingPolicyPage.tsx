import React from "react";

export default function ShippingPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Shipping Policy
        </h1>

        <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">Order Processing</h2>
            <p>
              All orders are processed within 1-3 business days. You will
              receive a confirmation email once your order is shipped.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">
              Shipping Methods & Delivery Time
            </h2>
            <ul className="list-disc ml-6">
              <li>Standard Shipping: 3-7 business days within India.</li>
              {/* <li>Express Shipping: 1-3 business days within India.</li>
              <li>
                International Shipping: 7-15 business days depending on
                location.
              </li> */}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Shipping Charges</h2>
            <p>
              Shipping charges are calculated at checkout based on your delivery
              location and chosen shipping method. Free shipping may be
              available for orders above a certain amount.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Order Tracking</h2>
            <p>
              Once your order is shipped, you will receive a tracking number via
              email. You can use this number to track your order on the
              courier’s website and on the Vani Sarees Order Details Page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Delivery Issues</h2>
            <p>
              In case of any delay, lost, or damaged shipments, please contact
              our customer support at{" "}
              <a
                href="mailto:contact@vanisarees.in"
                className="text-red-600 hover:underline"
              >
                contact@vanisarees.in
              </a>{" "}
              within 7 days of delivery.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">Contact Us</h2>
            <p>
              For any questions regarding shipping, please reach out to us via{" "}
              <a
                href="mailto:contact@vanisarees.in"
                className="text-red-600 hover:underline"
              >
                email
              </a>{" "}
              or our WhatsApp number{" "}
              <a
                href="https://wa.me/919550607240"
                className="text-green-600 hover:underline"
              >
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
