import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, LineChart, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-semibold text-gray-900">
              CryptoCorr
            </span>
          </div>
          <Link to="/dashboard">
            <Button>Launch App</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Discover Crypto Market Patterns
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Analyze cryptocurrency correlations with precision. Make informed
              decisions with our advanced correlation analysis tools.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Start Analyzing
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-500 mx-auto flex items-center justify-center mb-4">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-time Analysis
                </h3>
                <p className="text-gray-600">
                  Track cryptocurrency correlations as they happen with our
                  real-time analysis tools.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-500 mx-auto flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Market Insights
                </h3>
                <p className="text-gray-600">
                  Discover hidden patterns and relationships between different
                  cryptocurrencies.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-500 mx-auto flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Quick Actions
                </h3>
                <p className="text-gray-600">
                  Easily switch between timeframes and currency pairs with our
                  intuitive interface.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2024 CryptoCorr. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
