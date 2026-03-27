import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Shield, TrendingUp, Eye, Zap, Menu, X } from "lucide-react";
import { useState } from "react";

export function HomePage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stats = [
    { value: "98.7%", label: "Model Accuracy" },
    { value: "2.3s", label: "Score Generation" },
    { value: "500K+", label: "Scores Generated" },
    { value: "47%", label: "More Inclusive" }
  ];

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Scoring",
      description: "Harness the power of AI with 200+ behavioral signals to generate accurate, real-time credit scores beyond traditional metrics"
    },
    {
      icon: TrendingUp,
      title: "Financial Inclusion",
      description: "Open doors for the underbanked and thin-file applicants using alternative data like UPI, utility bills, and GST metrics"
    },
    {
      icon: Eye,
      title: "Explainability & Transparency",
      description: "Every decision comes with a clear, interpretable rationale: SHAP values, feature importance, and complete transparency"
    },
    {
      icon: Shield,
      title: "Bias-Free Lending",
      description: "Built on fairness monitoring, detects and mitigates biases across patterns, ensuring fair, gender-neutral lending"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-1.5">
              <img src="/images/download.png" alt="Bird" className="w-10 h-10" />
              <span className="font-bold text-xl sm:text-xl text-slate-900">CREDIT</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-10">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors text-base lg:text-lg">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition-colors text-base lg:text-lg">How It Works</a>
              <a href="#security" className="text-slate-600 hover:text-blue-600 transition-colors text-base lg:text-lg">Security</a>
              <Button 
                onClick={() => navigate("/login")} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 lg:px-8 py-2 text-base font-semibold"
              >
                Get Started
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-700"
            >
              {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3 border-t border-slate-200">
              <a href="#features" className="block text-slate-600 hover:text-blue-600 transition-colors py-2 text-base">Features</a>
              <a href="#how-it-works" className="block text-slate-600 hover:text-blue-600 transition-colors py-2 text-base">How It Works</a>
              <a href="#security" className="block text-slate-600 hover:text-blue-600 transition-colors py-2 text-base">Security</a>
              <Button 
                onClick={() => navigate("/login")} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold py-2"
              >
                Get Started
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-[67.28vh] flex items-center justify-center overflow-hidden bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url(/images/dashboard-hero.png)',
          backgroundSize: '99%'
        }}
      >
        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-50 to-blue-50"></div>
        
        {/* Content */}
        <div className="relative z-10 w-full">
          <div className="px-10 sm:px-12 md:px-16 lg:px-20 xl:px-24 py-11 sm:py-15 lg:py-19">
            <div className="text-center max-w-4xl mx-auto">
              {/* <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 sm:px-5 py-3 rounded-full text-sm sm:text-base mb-6 sm:mb-8 border border-blue-500/30">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                AI-Powered Credit Intelligence Platform
              </div> */}
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-slate-900 mb-3 sm:mb-6">
                Credit Scoring
              </h1>
              <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-blue-600 mb-6 sm:mb-10">
                Reimagined by AI
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-slate-700 max-w-3xl mx-auto mb-4 sm:mb-6">
                <span className="font-semibold text-slate-900">CREDIT</span> — Comprehensive Risk Evaluation through Data-Driven Intelligence
              </p>
              {/* <p className="text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl mx-auto mb-10 sm:mb-16">
                AI models analyze 200+ behavioral signals from your financial data to generate fair, explainable credit scores in seconds
              </p> */}
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <Button 
                  onClick={() => navigate("/login")} 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-7 sm:px-9 py-5 sm:py-6 text-base sm:text-lg font-semibold shadow-lg shadow-blue-600/50"
                >
                  Check Your Credit Score →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-y border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-xs sm:text-sm lg:text-base text-slate-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why CREDIT Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 sm:mb-4">Why CREDIT?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-4">
              The next generation of credit intelligence, built for fair and transparent lending decisions
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-slate-300 hover:border-blue-500 transition-all hover:shadow-lg bg-white hover:shadow-blue-500/20">
                <CardHeader>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4 border border-blue-300">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg sm:text-xl text-slate-900">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-600 text-sm sm:text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-blue-100 border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 sm:mb-6">
            Ready to Check Your Credit Score?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-700 mb-6 sm:mb-8">
            Get instant access to your AI-powered credit score and detailed financial insights
          </p>
          <Button 
            onClick={() => navigate("/login")} 
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto shadow-lg shadow-blue-600/50"
          >
            Get Started Now →
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <img src="/images/download.png" alt="Bird" className="w-8 h-8" />
                <span className="font-bold text-slate-900">CREDIT</span>
              </div>
              <p className="text-sm text-slate-600">
                AI-powered credit intelligence for fair lending decisions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Product</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li><a href="#" className="hover:text-blue-600">Credit Score</a></li>
                <li><a href="#" className="hover:text-blue-600">Features</a></li>
                <li><a href="#" className="hover:text-blue-600">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li><a href="#" className="hover:text-blue-600">About</a></li>
                <li><a href="#" className="hover:text-blue-600">Careers</a></li>
                <li><a href="#" className="hover:text-blue-600">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-3 sm:mb-4 text-sm sm:text-base">Legal</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-600">Terms</a></li>
                <li><a href="#" className="hover:text-blue-600">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-slate-600">
            <p>&copy; 2026 CREDIT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}