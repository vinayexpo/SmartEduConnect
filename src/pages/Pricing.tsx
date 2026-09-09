import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Pricing() {
  const navigate = useNavigate();

  const handleContactSales = (planName: string) => {
    const phoneNumber = "918712655512"; // Replace with your actual WhatsApp number
    const message = encodeURIComponent(`Hello! I'm interested in the ${planName} for SmartEduConnect.`);
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  const plans = [
    {
      name: "Starter / Web-first",
      users: "0–100 Users",
      price: "₹50",
      period: "per month",
      description: "Per User (Web only)",
      addon: "Optional mobile add-on per user: ₹83.33/month | ₹1,000/year",
      features: ["Student Management", "Attendance Tracking", "Assignments & Exams", "Basic Dashboard & Reports", "Parent Communication", "Web Access Only"],
      buttonText: "Contact Sales",
      topAccent: "bg-slate-400 dark:bg-slate-600",
      badgeClass: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      iconClass: "text-slate-500 dark:text-slate-400",
      borderClass: "border-border/60 hover:border-slate-300 dark:hover:border-slate-600",
      buttonClass: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
    },
    {
      name: "Growth Plan",
      users: "101–500 Users",
      price: "₹33.34",
      period: "per month",
      features: ["Everything in Starter", "Advanced Analytics", "Fee Management", "Timetable Scheduling", "Notifications & Alerts", "Multi-user Access"],
      buttonText: "Contact Sales",
      topAccent: "bg-sky-500",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
      iconClass: "text-sky-600 dark:text-sky-400",
      borderClass: "border-border/60 hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-sky-500/10",
      buttonClass: "bg-sky-50 hover:bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:hover:bg-sky-900/40 dark:text-sky-100",
    },
    {
      name: "Scale Plan",
      users: "501–1000 Users",
      price: "₹20.84",
      period: "per month",
      features: ["Everything in Growth", "Homework", "Role-based Dashboards", "Academic Performance Tracking", "Digital Records Management", "Real-time Communication"],
      buttonText: "Contact Sales",
      topAccent: "bg-indigo-600 dark:bg-indigo-500",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
      iconClass: "text-indigo-600 dark:text-indigo-400",
      borderClass: "border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-md hover:shadow-indigo-500/10",
      buttonClass: "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-100",
    },
    {
      name: "Enterprise Plan",
      users: "1001–2000 Users",
      price: "₹14.59",
      period: "per month",
      features: ["Everything in Scale", "Smart Scheduling", "Automated Reports", "Secure Cloud Access", "Parent-Teacher Communication Hub", "Institution-wide Analytics"],
      buttonText: "Contact Sales",
      topAccent: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      iconClass: "text-emerald-600 dark:text-emerald-400",
      borderClass: "border-border/60 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-emerald-500/10",
      buttonClass: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-100",
    },
    {
      name: "Large Institution Plan",
      users: "2001–3500 Users",
      price: "₹13",
      period: "per month",
      features: ["Everything in Enterprise", "Multi-campus Management", "Advanced ERP Automation", "Centralized Administration", "High-volume Data Handling", "Premium Support & Customization"],
      buttonText: "Contact Sales",
      topAccent: "bg-amber-500",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      iconClass: "text-amber-600 dark:text-amber-400",
      borderClass: "border-border/60 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-amber-500/10",
      buttonClass: "bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-100",
    },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/30 py-16 px-4 overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="container relative z-10 mx-auto max-w-[1600px]">
        <div className="mb-4 lg:mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="hover:bg-muted transition-all backdrop-blur-sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
        
        <div className="text-center mb-16 animate-slide-up">
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-black mb-4 tracking-tight">
            <span className="text-gradient">SmartEduConnect</span>
          </h1>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-foreground">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your institution. Upgrade or downgrade at any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 xl:gap-6 pb-8 pt-2 mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group bg-card border rounded-[24px] flex flex-col overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-xl animate-slide-up h-full ${plan.borderClass}`}
              style={{ animationDelay: `${index * 0.1 + 0.2}s` }}
            >
              {/* Highlighted Top Accent Line */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${plan.topAccent}`} />

              {/* Top Section: Info & Price */}
              <div className="p-5 xl:p-6 flex flex-col justify-between border-b border-border/50 relative pt-7 bg-muted/10">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg xl:text-xl font-extrabold text-foreground tracking-tighter whitespace-nowrap">{plan.name}</h3>
                  </div>
                  <div className={`inline-flex items-center justify-center rounded-lg px-2 py-1 xl:px-3 xl:py-1.5 text-xs font-bold mb-4 border shadow-sm ${plan.badgeClass}`}>
                    {plan.users}
                  </div>
                  <p className={`text-xs xl:text-sm font-semibold mb-2 transition-none ${plan.iconClass} ${!plan.description ? 'opacity-0 select-none pointer-events-none' : ''}`} aria-hidden={!plan.description}>
                    {plan.description || "Per User (Web only)"}
                  </p>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl xl:text-4xl font-black text-foreground">{plan.price}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider ml-1">{plan.period}</span>
                  </div>
                  
                  <div className={`mt-3 px-2 py-2 bg-background/50 rounded-lg text-[10px] xl:text-xs font-semibold border shadow-sm leading-tight transition-none ${plan.badgeClass} ${!plan.addon ? 'opacity-0 select-none pointer-events-none' : ''}`} aria-hidden={!plan.addon}>
                    {plan.addon || "Optional mobile add-on per user: ₹83.33/month | ₹1,000/year"}
                  </div>
                  
                  <Button 
                    className={`w-full mt-4 rounded-xl py-5 xl:py-6 font-bold text-xs xl:text-sm transition-all duration-300 shadow-sm hover:scale-[1.02] ${plan.buttonClass}`}
                    onClick={() => handleContactSales(plan.name)}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </div>

              {/* Bottom Section: Features */}
              <div className="p-5 xl:p-6 flex flex-col flex-1 bg-card">
                <h4 className="text-sm font-bold text-foreground mb-6 uppercase tracking-wider">What's included</h4>
                <ul className="flex flex-col gap-3 xl:gap-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 xl:gap-3 text-xs xl:text-sm font-medium text-muted-foreground group-hover:text-foreground/90 transition-colors">
                      <CheckCircle2 className={`h-4 w-4 xl:h-5 xl:w-5 shrink-0 opacity-80 ${plan.iconClass}`} />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}