import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HeroSection } from '../components/HeroSection';
import { 
  Search, 
  Target, 
  Users, 
  Award, 
  TrendingUp, 
  Shield, 
  Zap, 
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Search,
      title: 'Smart Search',
      description: 'AI-powered scholarship discovery based on your profile and preferences.'
    },
    {
      icon: Target,
      title: 'Personalized Matching',
      description: 'Get matched with scholarships that fit your academic background and goals.'
    },
    {
      icon: Users,
      title: 'Application Tracking',
      description: 'Keep track of all your scholarship applications in one centralized dashboard.'
    },
    {
      icon: Award,
      title: 'Success Analytics',
      description: 'Monitor your application success rate and optimize your strategy.'
    },
    {
      icon: TrendingUp,
      title: 'Real-time Updates',
      description: 'Stay updated with new scholarship opportunities and application deadlines.'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your personal information is protected with enterprise-grade security.'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Scholarships Available' },
    { number: '50,000+', label: 'Students Helped' },
    { number: '$100M+', label: 'Scholarships Awarded' },
    { number: '95%', label: 'Success Rate' }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Computer Science Student',
      content: 'ScholarAI helped me find and secure $15,000 in scholarships. The AI matching is incredible!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Engineering Student',
      content: 'The application tracking feature saved me so much time. I could focus on writing better essays.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Pre-Med Student',
      content: 'Found scholarships I never would have discovered on my own. The platform is a game-changer.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Features Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-text-hi mb-4">
              Why Choose ScholarAI?
            </h2>
            <p className="text-lg text-text-lo max-w-2xl mx-auto">
              Our AI-powered platform makes finding and applying for scholarships easier than ever before.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-elevated rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-102 border border-border">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-text-hi mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-lo leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-bg">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                  {stat.number}
                </div>
                <div className="text-text-lo font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-text-hi mb-4">
              What Students Say
            </h2>
            <p className="text-lg text-text-lo">
              Join thousands of successful scholarship recipients
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-elevated rounded-2xl p-6 shadow-md border border-border">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="text-warning fill-current" size={20} />
                  ))}
                </div>
                <p className="text-text-lo mb-6 italic leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-text-hi">{testimonial.name}</div>
                  <div className="text-text-lo text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading font-bold text-text-hi mb-6">
            Ready to Start Your Scholarship Journey?
          </h2>
          <p className="text-lg text-text-lo mb-8 max-w-2xl mx-auto">
            Join thousands of students who have already discovered their perfect scholarship matches.
          </p>
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <span>Create Free Account</span>
              <ArrowRight size={20} />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;