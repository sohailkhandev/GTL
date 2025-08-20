// Fotter component to show on all pages

import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-white text-center py-3 text-sm text-black">
      <div className="flex justify-center space-x-6">
        <Link to="/how-it-works" className="hover:underline">
          How It Works
        </Link>
        <Link to="/privacy-policy" className="hover:underline">
          Privacy Policy
        </Link>
        <Link to="/terms-of-service" className="hover:underline">
          Terms of Service
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
