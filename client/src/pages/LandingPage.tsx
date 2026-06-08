import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import Footer from "../components/layout/Footer";
import { Edges, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// --- 3D Components ---

const SketchMaterial = () => {
  return (
    <meshStandardMaterial color="#f0f0f0" roughness={0.9} metalness={0.0} />
  );
};

const PCBBoard = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const scrollY = window.scrollY || 0;

    // Base floating
    meshRef.current.position.y =
      Math.sin(time * 0.8) * 0.2 - 2 + scrollY * 0.001;
    meshRef.current.position.x = Math.sin(time * 0.4) * 0.1 - 4;

    // Add scroll based rotation parallax
    meshRef.current.rotation.x =
      Math.sin(time * 0.3) * 0.05 + 1.2 + scrollY * 0.0005;
    meshRef.current.rotation.y =
      Math.cos(time * 0.4) * 0.05 + 0.2 + scrollY * 0.0002;
    meshRef.current.rotation.z = Math.sin(time * 0.2) * 0.05 - 0.2;
  });

  return (
    // Smaller Scale per request: [7, 0.15, 5] from [9, 0.2, 7]
    <mesh ref={meshRef} position={[-4, -2, -6]} scale={[7, 0.15, 5]}>
      <boxGeometry args={[1, 1, 1]} />
      <SketchMaterial />
      <Edges scale={1.05} threshold={15} color="#1A1A1A" />

      {/* Main CPU */}
      <mesh position={[0.1, 0.6, 0.1]} scale={[0.4, 1, 0.4]}>
        <boxGeometry args={[1, 1, 1]} />
        <SketchMaterial />
        <Edges scale={1.05} threshold={15} color="#1A1A1A" />
      </mesh>
      {/* RAM Modules */}
      <mesh position={[-0.3, 0.6, 0.2]} scale={[0.15, 0.5, 0.35]}>
        <boxGeometry args={[1, 1, 1]} />
        <SketchMaterial />
        <Edges scale={1.05} threshold={15} color="#1A1A1A" />
      </mesh>
      <mesh position={[-0.3, 0.6, -0.2]} scale={[0.15, 0.5, 0.35]}>
        <boxGeometry args={[1, 1, 1]} />
        <SketchMaterial />
        <Edges scale={1.05} threshold={15} color="#1A1A1A" />
      </mesh>
      {/* Capacitors */}
      <mesh
        position={[0.4, 1, -0.3]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.1, 0.1, 1]}
      >
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <SketchMaterial />
        <Edges scale={1.05} threshold={15} color="#1A1A1A" />
      </mesh>
      <mesh
        position={[0.3, 1, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.1, 0.1, 1]}
      >
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <SketchMaterial />
        <Edges scale={1.05} threshold={15} color="#1A1A1A" />
      </mesh>
      {/* Connectors */}
      <mesh position={[-0.45, 0.6, 0]} scale={[0.1, 0.6, 0.8]}>
        <boxGeometry args={[1, 1, 1]} />
        <SketchMaterial />
        <Edges scale={1.05} threshold={15} color="#1A1A1A" />
      </mesh>
    </mesh>
  );
};

const SolderingIron = () => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/soldering_iron.glb");

  const styledScene = useMemo(() => {
    const clone = scene.clone();
    const sketchMat = new THREE.MeshStandardMaterial({
      color: "#dcdcdc",
      roughness: 0.8,
      metalness: 0.1,
    });
    const edgeMat = new THREE.LineBasicMaterial({
      color: "#1A1A1A",
      linewidth: 1,
    });

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = sketchMat;
        const edgesGeom = new THREE.EdgesGeometry(mesh.geometry, 15);
        const line = new THREE.LineSegments(edgesGeom, edgeMat);
        mesh.add(line);
      }
    });
    return clone;
  }, [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    const scrollY = window.scrollY || 0;

    groupRef.current.position.y =
      Math.cos(time * 0.7) * 0.2 + 3 - scrollY * 0.002;
    groupRef.current.position.x = Math.sin(time * 0.4) * 0.2 + 3;

    groupRef.current.rotation.x =
      Math.sin(time * 0.5) * 0.05 + 0.4 + scrollY * 0.0005;
    groupRef.current.rotation.y = Math.cos(time * 0.3) * 0.05 - 0.2;
    groupRef.current.rotation.z = Math.cos(time * 0.3) * 0.05 + 2.34; // Flipped 180 deg to point tip leftwards
  });

  return (
    <primitive
      ref={groupRef}
      object={styledScene}
      position={[3, 3, -4]}
      scale={[40, 40, 40]}
    />
  );
};

const MouseParallax = () => {
  const { camera } = useThree();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      gsap.to(camera.position, {
        x: x * 0.5,
        y: y * 0.5,
        duration: 1,
        ease: "power2.out",
      });
      camera.lookAt(0, 0, 0);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [camera]);

  return null;
};

const LandingNavbar = () => {
  return (
    <nav className="absolute top-0 left-0 w-full z-50 px-6 py-6 md:px-10 md:py-8 flex items-center justify-between pointer-events-auto">
      <div className="text-2xl md:text-3xl font-bold tracking-tight text-[#1A1A1A]">
        OmniPool
      </div>
      <div className="flex items-center gap-4 md:gap-8 text-[0.95rem] md:text-[1.05rem] font-medium">
        <Link
          to="/signin"
          className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="bg-[#8C7B9E] text-white px-4 py-2.5 sm:px-7 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-opacity-90 transition-all shadow-sm"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

// --- Page Sections ---

const FeaturesSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feature-card",
        { y: 60, opacity: 0 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
          },
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: "power3.out",
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-32 px-4 pointer-events-auto"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[#1A1A1A] tracking-tight">
            Everything You Need to <br className="hidden sm:block" />
            <span className="relative inline-block mt-2">
              <span className="relative z-10 px-4 py-1 text-[#8C7B9E]">
                Build Faster
              </span>
              <span className="absolute bottom-1 left-0 w-full h-[30%] bg-[#8C7B9E]/20 -z-10 rounded"></span>
            </span>
          </h2>
          <p className="text-[#4A4A4A] max-w-2xl mx-auto text-lg">
            OmniPool brings together hardware sharing, AI project analysis, and
            community mentorship in one beautiful platform.
          </p>
        </div>

        {/* Bento Box Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative z-20">
          {/* Large Hero Card - AI Matching */}
          <div className="feature-card lg:col-span-3 relative rounded-[2.5rem] p-6 sm:p-10 md:p-14 overflow-hidden group bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(140,123,158,0.15)] transition-all duration-500 flex flex-col justify-between min-h-[400px]">
            {/* 1px glowing gradient border effect via before element */}
            <div className="absolute inset-0 rounded-[2.5rem] p-[1px] bg-gradient-to-br from-white via-white/50 to-[#8C7B9E]/30 -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-[#8C7B9E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-8 h-full">
              <div className="flex-1 flex flex-col justify-center h-full text-center lg:text-left">
                <h3 className="text-3xl md:text-4xl font-bold mb-5 text-[#111] tracking-tight">
                  AI-Powered Matching
                </h3>
                <p className="text-[#555] text-lg leading-relaxed font-medium">
                  Describe your project in natural language. Our AI generates a
                  complete active bill of materials and instantly matches you
                  with the ideal hardware and talent in your vicinity.
                </p>
              </div>
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex-shrink-0 relative group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-700 ease-out flex items-center justify-center">
                <div className="absolute inset-0 bg-pink-400/20 blur-[50px] rounded-full mix-blend-multiply"></div>
                <img
                  src="/3d-icons/brain.png"
                  alt="3D Pink Brain Icon"
                  className="w-[120%] h-[120%] object-contain relative z-10 drop-shadow-2xl"
                />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-transparent via-pink-400/60 to-transparent group-hover:w-full transition-all duration-700 ease-out" />
          </div>

          {/* Right Column Stack */}
          <div className="lg:col-span-2 flex flex-col gap-6 h-full">
            {/* Top Small Card - Share Hardware */}
            <div className="feature-card flex-1 relative rounded-[2rem] p-6 sm:p-8 overflow-hidden group bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(140,123,158,0.15)] transition-all duration-500">
              <div className="absolute inset-0 rounded-[2rem] p-[1px] bg-gradient-to-br from-white via-white/50 to-blue-300/30 -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="w-20 h-20 flex items-center justify-center mx-auto lg:mx-0 mb-6 relative group-hover:scale-110 transition-transform duration-500">
                <div className="absolute inset-0 bg-blue-400/20 blur-[30px] rounded-full mix-blend-multiply"></div>
                <img
                  src="/3d-icons/wrench.png"
                  alt="3D Holographic Wrench"
                  className="w-full h-full object-contain drop-shadow-xl relative z-10"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#111] tracking-tight text-center lg:text-left">
                Share Hardware
              </h3>
              <p className="text-[#555] leading-relaxed font-medium text-center lg:text-left">
                List your idle Raspberry Pis, Arduinos, sensors, and tools for
                your community to borrow securely.
              </p>
            </div>

            {/* Bottom Small Card - Find Mentors */}
            <div className="feature-card flex-1 relative rounded-[2rem] p-6 sm:p-8 overflow-hidden group bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(140,123,158,0.15)] transition-all duration-500">
              <div className="absolute inset-0 rounded-[2rem] p-[1px] bg-gradient-to-br from-white via-white/50 to-purple-300/30 -z-10 shadow-[inset_0_0_20px_rgba(255,255,255,0.5)]"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#8C7B9E]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

              <div className="w-20 h-20 flex items-center justify-center mx-auto lg:mx-0 mb-6 relative group-hover:scale-110 transition-transform duration-500">
                <div className="absolute inset-0 bg-purple-400/20 blur-[30px] rounded-full mix-blend-multiply"></div>
                <img
                  src="/3d-icons/community.png"
                  alt="3D Community Icon"
                  className="w-full h-full object-contain drop-shadow-xl relative z-10"
                />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-[#111] tracking-tight text-center lg:text-left">
                Find Mentors
              </h3>
              <p className="text-[#555] leading-relaxed font-medium text-center lg:text-left">
                Connect with nearby experts who have the exact skills your
                project needs. Collaborate and learn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".step-bubble",
        { scale: 0, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          },
          scale: 1,
          opacity: 1,
          stagger: 0.2,
          duration: 0.6,
          ease: "back.out(1.5)",
        },
      );
      gsap.fromTo(
        ".step-text",
        { y: 20, opacity: 0 },
        {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 60%",
          },
          y: 0,
          opacity: 1,
          stagger: 0.2,
          duration: 0.6,
          delay: 0.2,
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    {
      step: "01",
      title: "Describe Your Project",
      description: "Type what you want to build in plain English.",
    },
    {
      step: "02",
      title: "AI Analyzes & Matches",
      description: "Gemini AI extracts a complete Bill of Materials natively.",
    },
    {
      step: "03",
      title: "Connect & Build",
      description: "Borrow hardware and team up with mentors locally.",
    },
  ];

  return (
    <section
      ref={containerRef}
      className="relative z-10 py-24 px-4 bg-[#F0EEEA]/80 backdrop-blur-md pointer-events-auto border-y border-black/5"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4 text-[#1A1A1A] tracking-tight">
            How It Works
          </h2>
          <p className="text-[#4A4A4A] max-w-lg mx-auto text-lg">
            From idea to reality in three absolutely simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative w-full">
          {/* Subtle connecting line */}
          <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-[2px] bg-[#8C7B9E]/20" />

          {steps.map((step) => (
            <div
              key={step.step}
              className="relative flex flex-col items-center text-center"
            >
              <div className="step-bubble w-20 h-20 rounded-[1.5rem] bg-white border-2 border-[#8C7B9E] flex items-center justify-center text-2xl font-bold text-[#8C7B9E] z-10 shadow-lg mb-6">
                {step.step}
              </div>
              <div className="step-text">
                <h3 className="text-xl font-bold mb-3 text-[#1A1A1A]">
                  {step.title}
                </h3>
                <p className="text-[#555] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const EnterpriseSection = () => {
  return (
    <section className="relative z-10 py-24 px-4 bg-[#F8F7F2] pointer-events-auto">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1A1A1A] rounded-[2.5rem] p-8 sm:p-12 md:p-16 relative overflow-hidden group shadow-2xl">
          {/* Subtle gradient glow inside */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8C7B9E]/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <svg width="250" height="250" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-[2.25rem] sm:text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] max-w-xl mx-auto lg:mx-0">
                Turn Dead Inventory <br className="hidden md:block"/> 
                <span className="text-white/90">into Community Innovation.</span>
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl leading-relaxed mx-auto lg:mx-0">
                OmniPool equips electronic manufacturers and distributors with a seamless platform to donate or list surplus stock, fueling grassroots engineering while hitting corporate ESG targets.
              </p>
              
              <Link to="/enterprise">
                <button className="px-8 py-4 rounded-full bg-white text-[#1A1A1A] font-bold text-lg hover:bg-[#EAE8E3] hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 mx-auto lg:mx-0 w-full sm:w-auto">
                  Apply for Partnership
                  <span className="text-xl leading-none">→</span>
                </button>
              </Link>
            </div>
            
            <div className="flex-1 w-full flex justify-center lg:justify-end">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-[500px]">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-bold mb-2 text-lg flex items-center gap-2">👔 Tax-Deductible</h4>
                  <p className="text-white/50 text-sm leading-relaxed">Automated documentation for hardware transfers to academic organizations for immediate tax write-offs.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-bold mb-2 text-lg flex items-center gap-2">♻️ ESG Targets</h4>
                  <p className="text-white/50 text-sm leading-relaxed">Drastically reduce electronic waste by routing functional components to actual developers.</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md sm:col-span-2 hover:bg-white/10 transition-colors">
                  <h4 className="text-white font-bold mb-2 text-lg flex items-center gap-2">🚀 Brand Penetration</h4>
                  <p className="text-white/50 text-sm leading-relaxed">Build severe goodwill among rising engineers by putting your proprietary components directly in their hands.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How does OmniPool work?",
      answer:
        "OmniPool connects builders, hackers, and creators. You can list hardware you're willing to lend, or request hardware you need. The platform matches users based on location and project needs.",
    },
    {
      question: "Is it free to use?",
      answer:
        "Yes, OmniPool is entirely free for community members. We believe in open access to hardware and knowledge sharing.",
    },
    {
      question: "How do I ensure my hardware is safe?",
      answer:
        "We have a built-in trust and review system. Members must verify their identity, and both borrowers and lenders review each other after every exchange to build community trust.",
    },
    {
      question: "Can I find mentors for my project here?",
      answer:
        "Absolutely! OmniPool has a dedicated mentor network. When you post a project description, our AI parses your requirements and connects you with community experts who have the exact skills you need.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="relative z-10 py-32 px-4 pointer-events-auto bg-[#F8F7F2]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-[#1A1A1A] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-[#4A4A4A] text-lg">
            Everything you need to know about scaling your community projects.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-[1.5rem] border border-[#8C7B9E]/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => toggleFAQ(index)}
            >
              <div className="p-6 md:px-8 flex justify-between items-center">
                <h3 className="font-bold text-[#1A1A1A] text-lg md:text-xl">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0 ml-4 w-8 h-8 rounded-full bg-[#F0EBF5] text-[#8C7B9E] flex items-center justify-center text-xl font-bold">
                  {openIndex === index ? "−" : "+"}
                </div>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
              >
                <div className="px-6 md:px-8 pb-6">
                  <p className="text-[#555] leading-relaxed text-md">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Main Landing Page ---
const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const user = useStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    // Top Hero Initial GSAP Load Sequence
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      gsap.set(".landing-wrapper", { opacity: 0 });
      gsap.set(".canvas-container", { opacity: 0 });

      tl.to(".landing-wrapper", { opacity: 1, duration: 0.2 })
        .to(
          ".canvas-container",
          { opacity: 1, duration: 1.2, ease: "power2.out" },
          "-=0.2",
        )
        .from(
          ".navbar-item",
          {
            y: -20,
            opacity: 0,
            stagger: 0.05,
            duration: 0.6,
            ease: "back.out(1.5)",
          },
          "-=1.0",
        )
        .from(
          ".stagger-text",
          {
            y: 40,
            scale: 0.95,
            opacity: 0,
            stagger: 0.1,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.8",
        );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className="landing-wrapper relative w-full min-h-screen overflow-x-hidden font-sans bg-grid-texture"
      style={{ backgroundColor: "#F8F7F2" }}
    >
      <LandingNavbar />

      {/* FIXED 3D Background - stays behind everything during scroll */}
      <div className="canvas-container hidden md:block fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={2.5} />
          <PCBBoard />
          <SolderingIron />
          <MouseParallax />
        </Canvas>
      </div>

      {/* Hero Section Container */}
      <main className="relative z-10 w-full h-screen flex flex-col items-center justify-center px-4 pointer-events-none">
        <div className="flex flex-col items-center text-center max-w-[900px] mt-12">
          {/* Headline */}
          <h1 className="stagger-text text-3xl sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] font-bold text-[#111] mb-6 tracking-tight pointer-events-auto">
            The Community{" "}
            <span
              className="inline-block relative px-3 py-0.5 sm:px-4 sm:py-1 mx-1 rounded-xl sm:rounded-[20px]"
              style={{ backgroundColor: "#E0D2EC" }}
            >
              Hardware
            </span>
            <br className="hidden sm:block" />& Skill Exchange
          </h1>

          {/* Sub-headline */}
          <p className="stagger-text text-base sm:text-lg md:text-[1.35rem] text-[#333] max-w-3xl mx-auto mb-8 md:mb-12 leading-[1.6] font-medium px-4 pointer-events-auto">
            Your platform to exchange expertise, access hardware, and build
            <br className="hidden md:block" />
            complex projects. Collaborate and grow with your community.
          </p>

          {/* CTAs */}
          <div className="stagger-text flex flex-col sm:flex-row items-center justify-center gap-5 w-full pointer-events-auto">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto hover:opacity-90 transition-opacity"
            >
              <button
                className="w-full sm:w-auto px-10 py-4 rounded-[20px] font-semibold text-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#8A6fa8",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 10px 25px rgba(138, 111, 168, 0.3)",
                }}
              >
                Start Building
                <span className="text-xl leading-none ml-1">→</span>
              </button>
            </Link>
            <Link
              to="/registry"
              className="w-full sm:w-auto hover:opacity-90 transition-opacity"
            >
              <button
                className="w-full sm:w-auto px-10 py-4 rounded-[20px] font-semibold text-lg box-border"
                style={{
                  backgroundColor: "#201f1d",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
                }}
              >
                Explore Registry
              </button>
            </Link>
          </div>


        </div>
      </main>

      {/* Informational Scroll Sections */}
      <FeaturesSection />
      <HowItWorksSection />
      <EnterpriseSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
