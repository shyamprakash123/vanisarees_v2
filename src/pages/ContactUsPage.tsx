import { Instagram, Mail, MapPin, Phone } from "lucide-react";

export default function ContactUs() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Get in Touch
            </h2>
            <p className="text-gray-700 text-sm">
              Have questions or need assistance? Reach out to us through any of
              the following channels.
            </p>

            <ul className="space-y-4 text-gray-700 text-sm">
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-500" />
                Kondapur, Hyderabad, Telangana, India
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-green-500" />
                +91 95506 07240
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500" />
                contact@vanisarees.in
              </li>
            </ul>

            <div className="flex gap-3 mt-4">
              <a
                href="https://www.instagram.com/vanisarees"
                target="_blank"
                className="p-2 bg-gray-800 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a
                href="mailto:contact@vanisarees.in"
                className="p-2 bg-gray-800 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Mail className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://wa.me/919550607240"
                target="_blank"
                className="p-2 bg-gray-800 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Phone className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Send Us a Message
            </h2>
            <form className="space-y-4 bg-white p-6 rounded-lg shadow-md">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Your Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Your Message"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
