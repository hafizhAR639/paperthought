import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Brain, BookOpen } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="font-semibold text-lg">PaperThought</span>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="text-neutral-700 hover:text-primary-600">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-900 mb-6">
            Elevate Your <span className="text-primary-600">Academic Writing</span>
          </h1>
          <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
            AI-powered platform for students and researchers to improve paper quality through
            intelligent analysis of citations, coherence, alignment, and research gaps.
          </p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-lg">
            Start Free <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">
          Powerful Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <Brain className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">AI Analysis</h3>
            <p className="text-neutral-600">
              Intelligent evaluation of your paper's critical thinking, citation quality, and overall
              argumentative structure.
            </p>
          </div>
          <div className="card text-center">
            <Zap className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">Real-time Feedback</h3>
            <p className="text-neutral-600">
              Get instant, actionable feedback as you revise. See scores improve in real-time as you
              address issues.
            </p>
          </div>
          <div className="card text-center">
            <BookOpen className="w-12 h-12 text-primary-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">Reference Matching</h3>
            <p className="text-neutral-600">
              Upload reference papers and discover relevant theories that strengthen your arguments
              automatically.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card bg-gradient-to-r from-primary-600 to-blue-600 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Writing?</h2>
          <p className="text-lg opacity-90 mb-6">
            Join thousands of students and researchers improving their academic writing
          </p>
          <Link to="/register" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-neutral-50 transition inline-flex items-center gap-2">
            Start for Free <ArrowRight size={20} />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-neutral-600 text-sm">
          <p>&copy; 2024 PaperThought. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
