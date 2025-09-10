"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen((o) => !o);

  return (
    <nav
      id="site-nav"
      data-nav-fixed
      className="fixed top-0 left-0 w-full bg-black/70 text-white backdrop-blur-md shadow-md z-50"
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Site name */}
        <Link href="/" className="text-xl font-bold hover:text-blue-400 transition-colors">
          Matthew Lew
        </Link>

        {/* Desktop nav */}
        <div className="space-x-6 hidden sm:flex">
          <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-blue-400 transition-colors">About</Link>
          <Link href="/projects" className="hover:text-blue-400 transition-colors">Projects</Link>
          <Link href="/contact" className="hover:text-blue-400 transition-colors">Contact</Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={toggleMenu}
          className="sm:hidden focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {isOpen && (
        <div className="sm:hidden px-6 pb-4">
          <ul className="space-y-2">
            <li><Link href="/" className="block hover:text-blue-400" onClick={toggleMenu}>Home</Link></li>
            <li><Link href="/about" className="block hover:text-blue-400" onClick={toggleMenu}>About</Link></li>
            <li><Link href="/projects" className="block hover:text-blue-400" onClick={toggleMenu}>Projects</Link></li>
            <li><Link href="/contact" className="block hover:text-blue-400" onClick={toggleMenu}>Contact</Link></li>
          </ul>
        </div>
      )}
    </nav>
  );
}
