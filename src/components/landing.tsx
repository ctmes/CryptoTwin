import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  SplitSquareHorizontal,
  LineChart,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SplitSquareHorizontal className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-semibold text-gray-900">
              CryptoTwin
            </span>
          </div>
          <Link to="/dashboard">
            <Button>Launch App</Button>
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Crypto Analysis
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Advanced correlation analysis and market insights for informed
              trading decisions.
            </p>
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Start Analysis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                  <LineChart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Real-time Analysis
                </h3>
                <p className="text-gray-600">
                  Track market movements and correlations with
                  professional-grade analytics.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                  <SplitSquareHorizontal className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Correlation Insights
                </h3>
                <p className="text-gray-600">
                  Discover hidden patterns and relationships between digital
                  assets.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Market Intelligence
                </h3>
                <p className="text-gray-600">
                  Make data-driven decisions with comprehensive market metrics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>© 2024 CryptoTwin. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
