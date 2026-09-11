import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Loader2, GraduationCap, ArrowRight, CheckCircle2, Landmark, ClipboardCheck, TrendingUp, Users, BookOpen, Calendar, FileText, Bell } from 'lucide-react';

const APP_SCREENS = [
  "https://i.postimg.cc/x1Fs3Yy6/Whats-App-Image-2026-05-25-at-2-59-17-PM.jpg",
  "https://i.postimg.cc/BZzvLZ6V/Whats-App-Image-2026-05-25-at-3-44-17-PM.jpg",
  "https://i.postimg.cc/W332zxcK/Whats-App-Image-2026-05-25-at-3-44-18-PM.jpg",
  "https://i.postimg.cc/Vs2CyWjt/Whats-App-Image-2026-05-25-at-3-44-19-PM.jpg",
  "https://i.postimg.cc/VNN60Jq8/Whats-App-Image-2026-05-25-at-3-44-20-PM-(1).jpg",    
];

export default function Index() {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % APP_SCREENS.length);
    }, 5000); // Rotates every 5 seconds
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && user && userRole) {
      navigate(`/${userRole}`);
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Modern Grid Background with Glow */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-50 blur-[100px]"></div>
      </div>

      {/* Header Navigation */}
      <header className="container mx-auto px-4 pt-6 flex justify-between items-center relative z-20 animate-fade-in">
        <img 
          src="https://schoolwebapp1.s3.ap-south-2.amazonaws.com/logos/ase_logo.webp"
          alt="Smart EduConnect Logo" 
          className="h-12 md:h-16 w-auto object-contain" 
        />
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/pricing')}
          >
            Pricing
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/about-us')}
          >
            About Us
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.open('https://www.asetechnologies.in/contact-us/', '_blank')}
          >
            Contact Us
          </Button>
        </nav>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center pt-12 pb-16 relative">

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-8 max-w-6xl mx-auto">
              
            {/* Left side text & CTA */}
            <div className="text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Empower Your School with <br className="hidden md:block" />
                <span className="text-gradient">SmartEduConnect</span>
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-slide-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
                A unified platform to streamline administration, empower teachers, and keep parents closely connected with their child's educational journey.
              </p>
              
              <div className="flex justify-center lg:justify-start animate-slide-up w-full mx-auto lg:mx-0" style={{ animationDelay: '0.3s' }}>
                <Button 
                  size="lg" 
                  className="gradient-primary text-base px-8 py-6 shadow-glow hover:shadow-xl hover:-translate-y-1 transition-all w-full sm:w-auto"
                  onClick={() => navigate('/auth')}
                >
                  Go to Portal <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Right side mobile screen with rotating images */}
            <div className="flex justify-center items-center w-full animate-slide-up z-10 relative py-12 lg:py-0" style={{ animationDelay: '0.4s' }}>
              
              {/* Inline styles for custom orbit animation */}
              <style>{`
                @keyframes orbit {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes antiorbit {
                  from { transform: rotate(360deg); }
                  to { transform: rotate(0deg); }
                }
                .animate-orbit { animation: orbit 30s linear infinite; }
                .animate-antiorbit { animation: antiorbit 30s linear infinite; }
                .animate-orbit-slow { animation: orbit 45s linear infinite reverse; }
                .animate-antiorbit-slow { animation: antiorbit 45s linear infinite reverse; }
              `}</style>

              {/* Outer Orbit Track */}
              <div className="absolute inset-0 m-auto w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] border border-dashed border-primary/20 rounded-full animate-orbit z-0">
                {[
                  { Icon: BookOpen, top: "-5%", left: "40%" }, 
                  { Icon: Calendar, top: "40%", left: "92%" },
                  { Icon: FileText, top: "92%", left: "40%" },
                  { Icon: Bell, top: "40%", left: "-5%" },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-lg border-4 border-background bg-primary/10 flex items-center justify-center overflow-hidden animate-antiorbit"
                    style={{ top: item.top, left: item.left }}
                  >
                    <item.Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  </div>
                ))}
              </div>

              {/* Inner Orbit Track */}
              <div className="absolute inset-0 m-auto w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] border border-dashed border-primary/15 rounded-full animate-orbit-slow z-0">
                 <div className="absolute w-10 h-10 sm:w-14 sm:h-14 rounded-full shadow-md border-4 border-background bg-primary/10 flex items-center justify-center animate-antiorbit-slow" style={{ top: "10%", left: "80%" }}>
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                 </div>
                 <div className="absolute w-10 h-10 sm:w-14 sm:h-14 rounded-full shadow-md border-4 border-background bg-primary/10 flex items-center justify-center animate-antiorbit-slow" style={{ top: "80%", left: "10%" }}>
                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                 </div>
              </div>

              {/* Central Phone Mockup */}
              <div className="relative rounded-[2.5rem] border-[8px] border-slate-900 bg-slate-950 shadow-2xl overflow-hidden aspect-[9/19] w-48 sm:w-60 z-10 transform transition-transform duration-500 hover:scale-105">
                {/* Notch */}
                <div className="absolute top-0 inset-x-0 h-5 w-24 mx-auto bg-slate-900 rounded-b-2xl z-30"></div>
                {/* Inner Screen */}
                <div className="absolute inset-0 z-10 overflow-hidden bg-zinc-950">
                  {APP_SCREENS.map((src, idx) => (
                    <img 
                      key={idx}
                      src={src} 
                      alt={`App Screen ${idx + 1}`} 
                      className={`absolute inset-0 w-full h-full object-cover origin-center transition-all duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${idx === activeScreen ? 'opacity-100 z-20' : 'opacity-0 z-10'}`}
                      style={{
                        transform: idx === activeScreen ? 'translateY(0) scale(1)' : 'translateY(15%) scale(0.95)',
                        filter: idx === activeScreen ? 'blur(0px)' : 'blur(8px)',
                      }}
                      onError={(e) => { e.currentTarget.src = 'https://placehold.co/300x650/e2e8f0/64748b?text=Upload+Screen' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="mt-20 sm:mt-32 relative w-full mx-auto animate-slide-up px-4 pb-12 lg:pb-24" style={{ animationDelay: '0.6s' }}>

            {/* Horizontal Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 z-20 relative w-full max-w-6xl mx-auto">
              {[
                {
                  icon: <Landmark className="h-8 w-8" />,
                  title: 'For Administrators',
                  description: 'Complete centralized control over your institution.',
                  gradient: 'gradient-admin',
                  features: ['Student & Staff Management', 'Fee Collection & Reports', 'Timetable Scheduling'],
                },
                {
                  icon: <ClipboardCheck className="h-8 w-8" />,
                  title: 'For Teachers',
                  description: 'Tools to focus on teaching rather than paperwork.',
                  gradient: 'gradient-teacher',
                  features: ['Digital Attendance', 'Homework & Syllabus', 'Exam Grading'],
                },
                {
                  icon: <TrendingUp className="h-8 w-8" />,
                  title: 'For Parents',
                  description: 'Stay closely connected with your child\'s progress.',
                  gradient: 'gradient-parent',
                  features: ['Real-time Attendance', 'Online Fee Payments', 'Direct Messaging'],
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative bg-card/80 backdrop-blur-xl rounded-3xl border border-border/60 hover:border-foreground/20 hover:shadow-2xl transition-all duration-500 p-8 flex flex-col shadow-xl"
                >
                  <div className="flex flex-col items-center text-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${feature.gradient} flex items-center justify-center text-white shrink-0`}>
                      {feature.icon}
                    </div>
                    <h3 className="font-display text-2xl font-bold tracking-tight">{feature.title}</h3>
                  </div>
                  
                  <p className="text-muted-foreground mb-6 text-base leading-relaxed text-center flex-1">{feature.description}</p>
                  
                  <div className="pt-5 border-t border-border/50">
                    <ul className="space-y-3">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 py-8 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">SmartEduConnect</span>
          </div>
          
          <p>
            © 2026 SmartEduConnect. All rights reserved. Designed and Developed by{' '}
            <a 
              href="https://www.asetechnologies.in/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium hover:text-primary transition-colors"
            >
              AseTechnologies
            </a>.
          </p>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/terms-and-conditions')}
              className="hover:text-primary transition-colors"
            >
              Terms
            </button>
            <button
              onClick={() => navigate('/privacy-policy')}
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
