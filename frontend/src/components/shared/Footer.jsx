import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8 text-center md:text-left">

        {/* Branding */}
        <div className="md:w-1/2">
          <h3 className="text-2xl font-bold text-gray-800">
            Skill<span className="text-indigo-600">Bridge</span>
          </h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto md:mx-0">
            Empowering learners through skill-sharing and collaboration.
          </p>
        </div>

        {/* Social Links */}
        <div className="md:w-auto">
          <h4 className="text-gray-800 font-semibold mb-2">Connect with Us</h4>
          <div className="flex justify-center md:justify-start gap-4 text-gray-500">
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="hover:text-indigo-600">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com/" target="_blank" rel="noreferrer" className="hover:text-indigo-600">
              <Linkedin size={20} />
            </a>
            <a href="mailto:info@skillbridge.com" className="hover:text-indigo-600">
              <Mail size={20} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="text-center text-sm text-gray-400 mt-8">
        © {new Date().getFullYear()} SkillBridge. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
