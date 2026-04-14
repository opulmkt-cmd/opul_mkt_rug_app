import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, CheckCircle2, Ruler, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HowItWorksPage: React.FC = () => {
  const sections = [
    {
      title: "AI Design",
      icon: <Sparkles className="w-6 h-6 text-black" />,
      content: [
        "RugVision™ translates your ideas into rug-ready designs using AI trained on patterns, materials, and weaving techniques.",
        "• Convert inspiration into structured designs",
        "• Generate multiple variations instantly",
        "• Align visuals with real-world production constraints",
        "This is not just image generation — it is design translation for manufacturing"
      ],
      image: "https://cdn.shopify.com/s/files/1/0718/2712/8409/files/20a3813f6915_ba3de3af-75fe-4f56-85b2-c4acff803f69.png?v=1775562886",
      accent: "bg-black/5",
      fit: "object-contain"
    },
    {
      title: "Design Validation",
      icon: <ShieldCheck className="w-6 h-6 text-black" />,
      content: [
        "Every design is reviewed within 24–48 hours by textile specialists.",
        "We check:",
        "• Material compatibility (wool, silk, blends)",
        "• Construction method (tufted, knotted, flatweave)",
        "• Scale and proportions",
        "• Production feasibility",
        "AI creates. Experts finalize."
      ],
      image: "https://cdn.shopify.com/s/files/1/0718/2712/8409/files/showing-on-tables-samples-are-placed-on-tables-and-hand-are-also-stood-on-table.png?v=1771518311",
      accent: "bg-black/5"
    },
    {
      title: "Sampling Process",
      icon: <Ruler className="w-6 h-6 text-black" />,
      content: [
        "Before full production, you can order a sample.",
        "• Standard sizes: 8×8 or 10×10 inches",
        "• Matches final material and technique",
        "• Used to validate:",
        "  • color accuracy",
        "  • texture",
        "  • carving / pile height",
        "Sample cost can be adjusted in final order"
      ],
      image: "https://cdn.shopify.com/s/files/1/0718/2712/8409/files/5_c2d291d8-33ce-415b-b871-b29eb41820d6.png?v=1776156662",
      accent: "bg-black/5"
    },
    {
      title: "Production Process",
      icon: <Truck className="w-6 h-6 text-black" />,
      content: [
        "Once approved:",
        "• Final specifications are created",
        "• Assigned to artisan partners (India, Nepal, etc.)",
        "• Production timelines vary by:",
        "  • size",
        "  • complexity",
        "  • construction",
        "Each rug is:",
        "• handcrafted",
        "• quality checked",
        "• shipped globally"
      ],
      image: "https://cdn.shopify.com/s/files/1/0718/2712/8409/files/6_ad8f19e0-a621-4490-a3e5-8d6e09d2e6b3.png?v=1776156661",
      accent: "bg-black/5"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-none"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-black mb-4 block">
              The Journey
            </span>
            <h1 className="text-5xl lg:text-7xl font-serif font-bold tracking-tighter leading-[1.1] mb-8 whitespace-nowrap">
              From Vision to <span className="italic text-black">Masterpiece.</span>
            </h1>
            <p className="text-xl text-black/60 leading-relaxed">
              Discover how we combine cutting-edge AI technology with centuries-old 
              artisan craftsmanship to create products that are as unique as your imagination.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Process Sections */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 space-y-16">
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-16 items-center`}
            >
              <div className="flex-1 space-y-8">
                <div className={`w-16 h-16 ${section.accent} rounded-2xl flex items-center justify-center`}>
                  {section.icon}
                </div>
                <h2 className="text-3xl lg:text-4xl font-serif font-bold tracking-tight">
                  {section.title}
                </h2>
                <div className="space-y-1">
                  {section.content.map((line, i) => (
                    <p 
                      key={i} 
                      className={`text-lg ${line.startsWith('👉') ? 'font-bold text-black' : 'text-black/60'} leading-relaxed`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-[#EFBB76]/5 rounded-[2rem] scale-95 group-hover:scale-100 transition-transform duration-500" />
                  <img 
                    src={section.image} 
                    alt={section.title}
                    className={`relative w-full aspect-[4/3] ${section.fit || 'object-cover'} rounded-[1.5rem] shadow-2xl transition-all duration-700`}
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-black text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[#EFBB76]/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-8"
          >
            <h2 className="text-4xl lg:text-5xl font-serif font-bold tracking-tight">
              Ready to start your <br />
              <span className="italic text-white">design journey?</span>
            </h2>
            <p className="text-white/60 text-lg">
              Join thousands of designers and homeowners who are redefining 
              luxury interiors with RugVision™.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link 
                to="/design" 
                className="btn-primary min-w-[240px] py-5 text-sm flex items-center justify-center gap-3 shadow-xl"
              >
                Start Designing <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/tiers" 
                className="btn-secondary min-w-[240px] py-5 text-sm font-bold uppercase tracking-widest border border-white/20 rounded-full hover:bg-white/10 transition-all flex items-center justify-center"
              >
                View Pricing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
