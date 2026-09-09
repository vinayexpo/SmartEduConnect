import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-screen overflow-hidden pt-4 pb-16 lg:pt-6 px-6 md:px-12 lg:px-[8%] text-foreground font-sans bg-background"
    >
      {/* Decorative Glows */}
      <div className="absolute w-[220px] h-[220px] bg-primary/20 rounded-full blur-[60px] opacity-60 -top-[50px] right-0 z-0 pointer-events-none"></div>
      <div className="absolute w-[180px] h-[180px] bg-blue-500/20 rounded-full blur-[60px] opacity-60 bottom-0 -left-[50px] z-0 pointer-events-none"></div>

      {/* Top Bar */}
      <div className="relative z-10 flex justify-between items-center mb-4 lg:mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)} 
          className="hover:bg-muted transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <img 
          src="https://i.postimg.cc/SxrVv2Y4/ase-logo-removebg-preview.png" 
          alt="ASE Technologies Logo" 
          className="h-12 md:h-16 w-auto object-contain" 
        />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-[80px] items-center">
        
        {/* Left Side */}
        <div className="animate-slide-up">
          <h1 className="text-[32px] md:text-[46px] lg:text-[56px] leading-tight font-extrabold mb-[25px] text-foreground whitespace-nowrap">
            About Our <span className="text-primary">Company</span>
          </h1>
          
          <p className="text-[18px] leading-[1.8] text-muted-foreground mb-[35px]">
            At <span className="font-bold text-black dark:text-white">ASE</span> <span className="font-bold text-black dark:text-white">Technologies</span>, we are committed to delivering innovative digital solutions that help businesses grow, streamline operations, and stay ahead in a competitive market.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { title: "Website Development", desc: "Modern responsive websites with high performance and premium UI design." },
              { title: "Digital Marketing", desc: "Result-driven campaigns to boost brand visibility and business growth." },
              { title: "Social Media Management", desc: "Creative content strategies to engage audiences across platforms." },
              { title: "SEO & Software Solutions", desc: "Search optimization and custom software tailored for your business." }
            ].map((service, index) => (
              <div 
                key={index} 
                className="bg-card border border-border backdrop-blur-[10px] p-[22px] rounded-[20px] transition-all duration-400 hover:-translate-y-1.5 hover:border-primary hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] shadow-sm h-full flex flex-col justify-center"
              >
                <h3 className="text-[20px] font-semibold mb-2.5 text-foreground">{service.title}</h3>
                <p className="text-[14px] text-muted-foreground leading-[1.6]">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side (Main Card) */}
        <div className="relative z-10 animate-slide-up lg:self-end" style={{ animationDelay: '0.2s' }}>
          <div className="bg-card border border-border rounded-[30px] p-8 md:p-[40px] shadow-xl flex flex-col gap-4 sm:gap-6">
            <div>
              <h2 className="text-[32px] font-bold mb-3 text-foreground text-center sm:text-left">Why Choose Us?</h2>
              <p className="text-[15px] text-muted-foreground mb-[15px] sm:mb-[25px] text-center sm:text-left leading-relaxed">
                We combine industry expertise with cutting-edge technology to deliver scalable, secure, and user-friendly solutions tailored to your unique business needs.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {[
                { val: "50+", label: "Projects Completed" },
                { val: "25+", label: "Happy Clients" },
                { val: "5+", label: "Years Experience" },
                { val: "100%", label: "Client Satisfaction" }
              ].map((stat, index) => (
                <div key={index} className="bg-muted/50 border border-border/50 p-5 sm:p-[25px] rounded-[20px] flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-sm">
                  <h3 className="text-[32px] sm:text-[38px] font-bold text-primary mb-2 leading-none">{stat.val}</h3>
                  <p className="text-[13px] sm:text-[14px] text-muted-foreground font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> 

      {/* Clients Section */}
      <div className="relative z-10 mt-[70px] animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h2 className="text-[34px] font-bold text-center mb-[35px] text-foreground">Trusted By Institutions</h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[25px]">
          {[
            "https://i.postimg.cc/1zShpqxD/Whats-App-Image-2026-05-25-at-5-05-00-PM.jpg",
            "https://i.postimg.cc/76BF8tCZ/Whats-App-Image-2026-05-25-at-5-04-57-PM.jpg",
            "https://i.postimg.cc/3NVzWyCS/Whats-App-Image-2026-05-25-at-5-04-51-PM.jpg",
            "https://i.postimg.cc/0yph2y6G/Whats-App-Image-2026-05-25-at-5-04-48-PM.jpg",
            "https://i.postimg.cc/QtnynBz4/Whats-App-Image-2026-05-25-at-5-04-45-PM.jpg",
            "https://i.postimg.cc/gjCBmCmD/Whats-App-Image-2026-05-25-at-5-04-42-PM.jpg"
          ].map((logo, index) => (
            <div 
              key={index} 
              className="bg-card border border-border p-[30px_20px] rounded-[18px] text-center transition-all duration-400 hover:-translate-y-1.5 hover:bg-primary/5 hover:border-primary/30 flex items-center justify-center group shadow-sm"
            >
              <img 
                src={logo} 
                alt={`Client Logo ${index + 1}`} 
                className="w-full h-[60px] object-contain transition-all duration-400"
                onError={(e) => { e.currentTarget.src = `https://placehold.co/200x80/f1f5f9/94a3b8?text=LOGO+${index + 1}` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}