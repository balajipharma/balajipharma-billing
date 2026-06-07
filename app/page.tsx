import Link from "next/link";
import { CheckCircle2, ArrowRight, Sparkles, Zap, Shield, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-blue-100">

      {/* Top Banner
      <div className="bg-slate-900 text-white py-2 px-4 text-center text-xs font-medium tracking-wide">
        New: Team Workspaces and AI Automations are now in beta. <Link href="#" className="underline ml-1 hover:text-blue-400">Learn more →</Link>
      </div> */}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 border-b border-slate-200 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <div className="flex items-center gap-2.5 group cursor-pointer">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-6 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Balaji Pharma
              </span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              {['Product', 'Solutions', 'Pricing', 'Docs'].map((item) => (
                <Link key={item} href="#" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition">
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-slate-200 hover:bg-slate-800 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-20 pb-24 overflow-hidden">
        {/* Subtle Decorative Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[radial-gradient(50%_50%_at_50%_0%,rgba(59,130,246,0.06)_0%,rgba(255,255,255,0)_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[13px] font-bold text-blue-700 mb-10 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Modernize your workflow</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 mb-8">
            Focus on what You Want<br />
            <span className="text-blue-600">Not Focus What You Not Want.</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
            TaskFlow is the central nervous system for your team's projects.
            Beautifully simple, yet powerfully extensible.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link href='/auth/signup' className="h-14 px-10 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2 group">
              Get Started for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="h-14 px-10 bg-white border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm">
              View Roadmap
            </button>
          </div>

          {/* Grid Section
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            {[
              {
                title: 'Lightning Fast',
                desc: 'Optimized for speed. No loading spinners, just instant action.',
                icon: Zap,
                color: 'bg-amber-50 text-amber-600'
              },
              {
                title: 'Advanced Analytics',
                desc: 'Track team velocity and task bottlenecks with beautiful charts.',
                icon: BarChart3,
                color: 'bg-blue-50 text-blue-600'
              },
              {
                title: 'Enterprise Grade',
                desc: 'Secure by default with SSO, 2FA, and granular permissions.',
                icon: Shield,
                color: 'bg-emerald-50 text-emerald-600'
              },

            ].map((feature, i) => (
              <div key={i} className="group p-8 bg-white border border-slate-200 rounded-3xl hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300">
                <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div> */}

          {/* Trust Section */}
          <div className="mt-24 pt-10 border-t border-slate-100">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Trusted by Balaji Pharma</p>
            <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
              <span className="text-2xl font-black text-slate-800">PREVAMOX </span>
              <span className="text-2xl font-black text-slate-800">PREVAMOX-D</span>
              <span className="text-2xl font-black text-slate-800">PREVANAC</span>
              <span className="text-2xl font-black text-slate-800">INSTASOOTHE</span>
              <span className="text-2xl font-black text-slate-800">XENOCOM</span>
              <span className="text-2xl font-black text-slate-800">MACUSHINE</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
} 