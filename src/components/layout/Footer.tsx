import { Link } from "react-router-dom";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="bg-transparent">
            <Link to="/" className=" bg-transparent">
              <img
                src="/images/vanisarees_logo.png"
                alt="Logo"
                className="h-28 w-36 bg-transparent"
              />
            </Link>
            <p className="text-sm mb-4">
              Your destination for authentic and elegant sarees.
              {/* and traditional
              jewellery. */}
            </p>
            <div className="flex gap-3">
              <a
                href="https://wa.me/919550607240"
                target="_blank"
                className="p-2 bg-gray-800 rounded-lg hover:bg-red-700 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/vanisarees"
                target="_blank"
                className="p-2 bg-gray-800 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="mailto:contact@vanisarees.in"
                className="p-2 bg-gray-800 rounded-lg hover:bg-red-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4">Customer Service</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  className="hover:text-white transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="hover:text-white transition-colors"
                >
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Kondapur, Hyderabad, Telangana, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>+91 95506 07240</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>contact@vanisarees.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} Vani Sarees. All rights reserved.
          </p>
          <p className="mt-2">
            Crafted with ❤️ by{" "}
            <a
              href="https://dockpoint.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 transition-colors font-semibold"
            >
              Dock Point
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
