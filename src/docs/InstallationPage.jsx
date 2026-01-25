/**
 * SatsLegacy Installation Guide
 * 
 * Download and install SatsLegacy on your platform
 */
import React from 'react';
import { 
  Shield, Download, Monitor, Apple, Terminal, CheckCircle, 
  ChevronLeft, AlertTriangle, ExternalLink, HardDrive, Lock
} from 'lucide-react';

const InstallationPage = () => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <a href="#/docs" className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-500 transition-colors">
            <ChevronLeft size={16} />
            Back to Documentation
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <Download size={24} className="text-black" />
            </div>
            <div>
              <p className="text-orange-500 text-sm font-medium">Getting Started</p>
              <h1 className="text-3xl font-bold text-white">Installation</h1>
            </div>
          </div>
          <p className="text-xl text-zinc-400">
            Download and install SatsLegacy on Windows, macOS, or Linux. The application runs entirely locally — your keys and vault data never leave your machine.
          </p>
        </div>

        {/* Download Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Download</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Windows */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Monitor size={24} className="text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Windows</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">Windows 10 or later (64-bit)</p>
              <a 
                href="https://github.com/camiliosalomanda/SatsLegacy/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black px-4 py-2 rounded-lg font-medium transition-colors w-full justify-center"
              >
                <Download size={18} />
                Download .exe
              </a>
            </div>

            {/* macOS */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Apple size={24} className="text-zinc-300" />
                <h3 className="text-lg font-semibold text-white">macOS</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">macOS 11+ (Intel & Apple Silicon)</p>
              <a 
                href="https://github.com/camiliosalomanda/SatsLegacy/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full justify-center"
              >
                <Download size={18} />
                Download .dmg
              </a>
            </div>

            {/* Linux */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Terminal size={24} className="text-green-400" />
                <h3 className="text-lg font-semibold text-white">Linux</h3>
              </div>
              <p className="text-sm text-zinc-400 mb-4">Ubuntu 20.04+, Debian, Fedora</p>
              <a 
                href="https://github.com/camiliosalomanda/SatsLegacy/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg font-medium transition-colors w-full justify-center"
              >
                <Download size={18} />
                Download .AppImage
              </a>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
            <p className="text-sm text-zinc-400">
              <strong className="text-white">Verify your download:</strong> Always verify the SHA256 checksum of downloaded files against the hashes published in the GitHub release. This ensures the file hasn't been tampered with.
            </p>
          </div>
        </section>

        {/* Windows Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Monitor size={24} className="text-blue-400" />
            Windows Installation
          </h2>
          
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Option 1: Installer (Recommended)</h3>
              <ol className="space-y-2 text-zinc-300">
                <li className="flex gap-3">
                  <span className="text-orange-500 font-medium">1.</span>
                  Download <code className="bg-zinc-800 px-2 py-0.5 rounded text-sm">SatsLegacy Setup 1.0.0.exe</code>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-medium">2.</span>
                  Run the installer and follow the prompts
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-medium">3.</span>
                  Launch SatsLegacy from the Start Menu or Desktop shortcut
                </li>
              </ol>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Option 2: Portable Version</h3>
              <ol className="space-y-2 text-zinc-300">
                <li className="flex gap-3">
                  <span className="text-orange-500 font-medium">1.</span>
                  Download <code className="bg-zinc-800 px-2 py-0.5 rounded text-sm">SatsLegacy 1.0.0.exe</code>
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-medium">2.</span>
                  Move the file to your desired location
                </li>
                <li className="flex gap-3">
                  <span className="text-orange-500 font-medium">3.</span>
                  Double-click to run — no installation required
                </li>
              </ol>
              <p className="text-sm text-zinc-500 mt-3">The portable version stores data in the same directory as the executable.</p>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
              <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-200 font-medium">Windows SmartScreen Warning</p>
                <p className="text-sm text-yellow-200/70 mt-1">
                  You may see a "Windows protected your PC" warning. Click "More info" then "Run anyway". This happens because the app is new and hasn't built up reputation with Microsoft yet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* macOS Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Apple size={24} className="text-zinc-300" />
            macOS Installation
          </h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-4">
            <ol className="space-y-2 text-zinc-300">
              <li className="flex gap-3">
                <span className="text-orange-500 font-medium">1.</span>
                Download <code className="bg-zinc-800 px-2 py-0.5 rounded text-sm">SatsLegacy-1.0.0.dmg</code>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-medium">2.</span>
                Open the DMG file
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-medium">3.</span>
                Drag SatsLegacy to your Applications folder
              </li>
              <li className="flex gap-3">
                <span className="text-orange-500 font-medium">4.</span>
                Right-click the app and select "Open" (first time only)
              </li>
            </ol>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-200 font-medium">Gatekeeper Warning</p>
              <p className="text-sm text-yellow-200/70 mt-1">
                macOS may warn that SatsLegacy "cannot be opened because Apple cannot check it for malicious software." Right-click and select "Open" to bypass this, or go to System Preferences → Security & Privacy and click "Open Anyway".
              </p>
            </div>
          </div>
        </section>

        {/* Linux Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Terminal size={24} className="text-green-400" />
            Linux Installation
          </h2>
          
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">AppImage (Universal)</h3>
              <div className="bg-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300">
                <p>chmod +x SatsLegacy-1.0.0.AppImage</p>
                <p>./SatsLegacy-1.0.0.AppImage</p>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-3">Debian/Ubuntu (.deb)</h3>
              <div className="bg-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300">
                <p>sudo dpkg -i satslegacy_1.0.0_amd64.deb</p>
                <p>sudo apt-get install -f  # Install dependencies</p>
              </div>
            </div>
          </div>
        </section>

        {/* Data Storage */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <HardDrive size={24} className="text-orange-500" />
            Data Storage Location
          </h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-300 mb-4">
              SatsLegacy stores all data locally on your machine. Here's where to find your vault files:
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                <span className="text-zinc-400">Windows</span>
                <code className="bg-zinc-800 px-2 py-1 rounded text-sm text-zinc-300">%APPDATA%\SatsLegacy</code>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-700">
                <span className="text-zinc-400">macOS</span>
                <code className="bg-zinc-800 px-2 py-1 rounded text-sm text-zinc-300">~/Library/Application Support/SatsLegacy</code>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-zinc-400">Linux</span>
                <code className="bg-zinc-800 px-2 py-1 rounded text-sm text-zinc-300">~/.config/SatsLegacy</code>
              </div>
            </div>
          </div>
        </section>

        {/* Verify Installation */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Lock size={24} className="text-green-500" />
            Verify Installation
          </h2>
          
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
            <p className="text-zinc-300 mb-4">
              After installation, verify the integrity of your SatsLegacy install:
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Compare SHA256 checksum with the published hash on GitHub</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Verify the application signature (Windows/macOS)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-zinc-300">Build from source for maximum verification (advanced)</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Next Steps */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-4">Next Steps</h2>
          <div className="flex gap-4">
            <a href="#/docs/quick-start" className="flex-1 bg-orange-500 hover:bg-orange-600 text-black rounded-xl p-6 transition-colors text-center font-medium">
              Quick Start Guide →
            </a>
            <a href="#/docs/first-vault" className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl p-6 transition-colors text-center font-medium">
              Create Your First Vault →
            </a>
          </div>
        </section>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-8">
          <p className="text-zinc-500 text-sm text-center">
            Not your keys, not your coins. Not your script, not your inheritance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstallationPage;
