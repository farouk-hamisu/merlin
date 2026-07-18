import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Key, HelpCircle, 
  Send, AlertTriangle, ShieldCheck, Cpu, ArrowRight 
} from 'lucide-react';
import { authApi } from '../services/api';

export const Landing: React.FC = () => {
  const [telegramUsername, setTelegramUsername] = useState('@merlin_admin');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await authApi.getPublicSettings();
        if (data?.telegram_username) {
          setTelegramUsername(data.telegram_username);
        }
      } catch (err) {
        console.error('Failed to fetch public settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const telegramLink = `https://t.me/${telegramUsername.replace('@', '')}`;

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-cyber-border bg-cyber-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="https://res.cloudinary.com/uf6qp7jz/image/upload/f_auto,q_auto/ndlealogo_l2rdji" alt="NDLEA Logo" className="h-8 w-auto object-contain" />
              <span className="font-bold text-xl tracking-wider text-white">Merlin</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#about" className="text-cyber-text-muted hover:text-cyber-primary transition-colors text-sm font-medium">About</a>
              <a href="#how-it-works" className="text-cyber-text-muted hover:text-cyber-primary transition-colors text-sm font-medium">Workflow</a>
              <a href="#faq" className="text-cyber-text-muted hover:text-cyber-primary transition-colors text-sm font-medium">FAQ</a>
              <a href="#contact" className="text-cyber-text-muted hover:text-cyber-primary transition-colors text-sm font-medium">Contact</a>
              <div className="h-4 w-px bg-cyber-border" />
              <Link to="/login" className="text-cyber-primary hover:underline text-sm font-medium">Log In</Link>
              <Link to="/register" className="cyber-button text-sm px-4 py-1.5">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative py-20 lg:py-32 overflow-hidden border-b border-cyber-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-border bg-cyber-surface text-cyber-primary text-xs font-semibold uppercase mb-6 tracking-widest">
              <ShieldCheck className="h-4 w-4" /> Secure Validation Framework
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Official Verification & Drug Integrity Testing
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-cyber-text-muted max-w-2xl">
              An enterprise-grade document engine designed for secure drug test registration, passport integration, dynamic barcode generation, and immutable scanning verification.
            </p>
            
            {/* Warning Banner */}
            <div className="mt-8 flex gap-3 p-4 bg-cyber-danger/10 border border-cyber-danger/30 rounded-lg text-cyber-text text-sm">
              <AlertTriangle className="h-5 w-5 text-cyber-danger shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Mandatory System Notice:</strong> You must obtain a valid single-use Activation Code from the platform Administrator before generating any Drug Test Certificate.
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="cyber-button text-base px-6 py-3 font-semibold">
                <Send className="h-5 w-5" /> Contact Admin on Telegram
              </a>
              <Link to="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-cyber-border rounded-md text-white hover:bg-cyber-surface-hover transition-colors font-semibold">
                Generate Certificate <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
        {/* Flat decorative grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      </header>

      {/* About Section */}
      <section id="about" className="py-20 bg-cyber-surface/30 border-b border-cyber-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-wider uppercase">Platform Architecture</h2>
            <div className="h-1 w-20 bg-cyber-primary mx-auto mt-4" />
            <p className="mt-4 text-cyber-text-muted">
              Built on strict compliance requirements and modern verification standards to prevent counterfeiting and ensure absolute authenticity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="cyber-panel p-6">
              <div className="h-12 w-12 rounded-md bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center mb-6">
                <Cpu className="h-6 w-6 text-cyber-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Original HTML Engine</h3>
              <p className="text-cyber-text-muted text-sm leading-relaxed">
                Uses the exact formatting structure, signature blocks, and design margins of the NDLEA certification portal, ensuring 100% template alignment.
              </p>
            </div>

            <div className="cyber-panel p-6">
              <div className="h-12 w-12 rounded-md bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center mb-6">
                <Key className="h-6 w-6 text-cyber-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Activation Gatekeeper</h3>
              <p className="text-cyber-text-muted text-sm leading-relaxed">
                Strict single-use token activation flow preventing mass generation. Admin-validated authorization keys strictly enforce 1 key = 1 document ratio.
              </p>
            </div>

            <div className="cyber-panel p-6">
              <div className="h-12 w-12 rounded-md bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-cyber-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verification Audit Log</h3>
              <p className="text-cyber-text-muted text-sm leading-relaxed">
                Permanent QR-code verification endpoint logging details of each scan event to monitor validity and detect certificate tampering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 border-b border-cyber-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-wider uppercase">Document Workflow</h2>
            <div className="h-1 w-20 bg-cyber-primary mx-auto mt-4" />
            <p className="mt-4 text-cyber-text-muted">
              Follow these simple steps to generate and verify your secure certificate.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full border border-cyber-border bg-cyber-surface flex items-center justify-center text-lg font-bold text-cyber-primary mb-4">1</div>
              <h4 className="text-white font-bold mb-2">Request Code</h4>
              <p className="text-cyber-text-muted text-sm">Contact the administrator on Telegram to receive your unique activation key.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full border border-cyber-border bg-cyber-surface flex items-center justify-center text-lg font-bold text-cyber-primary mb-4">2</div>
              <h4 className="text-white font-bold mb-2">Register & Activate</h4>
              <p className="text-cyber-text-muted text-sm">Sign up on our platform, log in, and enter your key in the dashboard.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full border border-cyber-border bg-cyber-surface flex items-center justify-center text-lg font-bold text-cyber-primary mb-4">3</div>
              <h4 className="text-white font-bold mb-2">Generate PDF</h4>
              <p className="text-cyber-text-muted text-sm">Enter your full name and upload a passport image. The system generates the test instantly.</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full border border-cyber-border bg-cyber-surface flex items-center justify-center text-lg font-bold text-cyber-primary mb-4">4</div>
              <h4 className="text-white font-bold mb-2">Verify via Scan</h4>
              <p className="text-cyber-text-muted text-sm">Scan the dynamic QR code on the certificate to open the read-only verification page.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-cyber-surface/30 border-b border-cyber-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-wider uppercase">Frequently Asked Questions</h2>
            <div className="h-1 w-20 bg-cyber-primary mx-auto mt-4" />
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="cyber-panel p-6">
              <h4 className="text-white font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyber-primary shrink-0" />
                What is an Activation Key?
              </h4>
              <p className="mt-2 text-cyber-text-muted text-sm pl-7">
                An activation key is a single-use cryptographically secure token that grants a registered user the permission to generate exactly one drug test certificate. Once used, it is permanently invalidated.
              </p>
            </div>

            <div className="cyber-panel p-6">
              <h4 className="text-white font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyber-primary shrink-0" />
                How do I get an Activation Key?
              </h4>
              <p className="mt-2 text-cyber-text-muted text-sm pl-7">
                You can obtain an activation key directly by contacting the platform administrator via Telegram. You can find the contact link in the Hero and Contact sections of this page.
              </p>
            </div>

            <div className="cyber-panel p-6">
              <h4 className="text-white font-bold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-cyber-primary shrink-0" />
                How does document verification work?
              </h4>
              <p className="mt-2 text-cyber-text-muted text-sm pl-7">
                Every generated certificate has a unique QR code. When scanned, it redirects to a secure read-only page hosted on our domain, displaying the original certificate metadata to verify its authenticity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-white tracking-wider uppercase">Contact Administrator</h2>
          <div className="h-1 w-20 bg-cyber-primary mx-auto mt-4" />
          <p className="mt-6 text-lg text-cyber-text-muted">
            Need an activation code or have inquiries about validation? Reach out to the system administrator on Telegram for instant provisioning.
          </p>
          <div className="mt-8">
            <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="cyber-button text-lg px-8 py-4">
              <Send className="h-6 w-6" /> Contact via Telegram ({telegramUsername})
            </a>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-cyber-surface-hover)_0%,transparent_70%)] opacity-30 pointer-events-none" />
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-cyber-border bg-cyber-surface py-8 text-center text-xs text-cyber-text-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="https://res.cloudinary.com/uf6qp7jz/image/upload/f_auto,q_auto/ndlealogo_l2rdji" alt="NDLEA Logo" className="h-5 w-auto object-contain" />
            <span className="font-bold tracking-wider text-white">Merlin</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Merlin Platform. All Rights Reserved. Securing Certificate Integrity.</p>
        </div>
      </footer>
    </div>
  );
};
