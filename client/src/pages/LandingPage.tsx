import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
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

// --- Custom Navbar ---
const LandingNavbar = () => {
  return (
    <nav className="absolute top-0 left-0 w-full z-50 px-10 py-8 flex items-center justify-between pointer-events-auto">
      <div className="text-3xl font-bold tracking-tight text-[#1A1A1A]">
        OmniPool
      </div>
      <div className="hidden md:flex items-center gap-10 text-[1.05rem] font-medium text-[#4A4A4A]">
        <Link to="/" className="hover:text-[#1A1A1A] transition-colors">
          Home
        </Link>
        <Link
          to="/dashboard"
          className="hover:text-[#1A1A1A] transition-colors"
        >
          Dashboard
        </Link>
        <Link to="/registry" className="hover:text-[#1A1A1A] transition-colors">
          Registry
        </Link>
        <Link to="/skills" className="hover:text-[#1A1A1A] transition-colors">
          Skills
        </Link>
        <Link
          to="/enterprise"
          className="hover:text-[#1A1A1A] transition-colors"
        >
          Enterprise
        </Link>
      </div>
      <div className="flex items-center gap-8 text-[1.05rem] font-medium">
        <Link
          to="/signin"
          className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors"
        >
          Sign In
        </Link>
        <Link
          to="/signup"
          className="bg-[#8C7B9E] text-white px-7 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-sm"
        >
          Sign Up
        </Link>
      </div>
    </nav>
  );
};

// --- Page Sections ---

const AnimatedCounter: React.FC<{ value: number; suffix?: string }> = ({
  value,
  suffix = "",
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const valRef = useRef({ val: 0 });

  useEffect(() => {
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 85%",
        once: true,
        onEnter: () => {
          gsap.to(valRef.current, {
            val: value,
            duration: 2.0,
            ease: "power3.out",
            onUpdate: () => {
              setCount(Math.floor(valRef.current.val));
            },
          });
        },
      });
    }, ref);
    return () => ctx.revert();
  }, [value]);

  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-bold text-white mb-2">
      {count.toLocaleString()}
      {suffix}
    </div>
  );
};

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

  const features = [
    {
      icon: "🔧",
      title: "Share Hardware",
      description:
        "List your idle Raspberry Pis, Arduinos, sensors, and tools for your community to borrow.",
    },
    {
      icon: "🧠",
      title: "AI-Powered Matching",
      description:
        "Describe your project in natural language. Our AI generates a complete BOM and matches resources instantly.",
    },
    {
      icon: "👥",
      title: "Find Mentors",
      description:
        "Connect with nearby experts who have the exact skills your project needs. Learn while you build.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-32 px-4 pointer-events-auto"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-[#1A1A1A] tracking-tight">
            Everything You Need to <br />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-20">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="feature-card group relative p-10 text-center rounded-[2.5rem] bg-gradient-to-b from-white/90 to-white/40 backdrop-blur-2xl border border-white/60 shadow-xl shadow-black/[0.03] hover:shadow-2xl hover:shadow-[#8C7B9E]/20 hover:-translate-y-3 hover:border-[#8C7B9E]/40 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#8C7B9E]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-[#F0EBF5] to-white flex items-center justify-center text-4xl mx-auto mb-8 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),_0_4px_10px_rgba(140,123,158,0.1)] group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out">
                {feature.icon}
              </div>

              <h3 className="text-2xl font-bold mb-4 text-[#111] tracking-tight">
                {feature.title}
              </h3>
              <p className="text-[#444] leading-relaxed font-medium">
                {feature.description}
              </p>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-[#8C7B9E]/60 to-transparent group-hover:w-3/4 transition-all duration-500 ease-out" />
            </div>
          ))}
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

const StatsSection = () => {
  const stats = [
    { label: "Hardware Shared", value: 2800, suffix: "+" },
    { label: "Projects Matched", value: 1200, suffix: "+" },
    { label: "Community Mentors", value: 450, suffix: "+" },
    { label: "Cities Networked", value: 89, suffix: "" },
  ];

  return (
    <section className="relative z-10 py-32 px-4 pointer-events-auto bg-[#F8F7F2]">
      <div className="max-w-5xl mx-auto">
        <div className="p-12 md:p-16 rounded-[3rem] bg-[#1A1A1A] shadow-2xl relative overflow-hidden">
          {/* Subtle noise/texture layer */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay"></div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-10">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <div className="text-[#A0A0A0] font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Main Landing Page ---
const LandingPage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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
      <div className="canvas-container fixed inset-0 z-0 pointer-events-none">
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
          <h1 className="stagger-text text-[4.5rem] leading-[1.1] font-bold text-[#111] mb-6 tracking-tight pointer-events-auto">
            The Community{" "}
            <span
              className="inline-block relative px-4 py-1 mx-1 rounded-[20px]"
              style={{ backgroundColor: "#E0D2EC" }}
            >
              Hardware
            </span>
            <br className="hidden sm:block" />& Skill Exchange
          </h1>

          {/* Sub-headline */}
          <p className="stagger-text text-[1.35rem] text-[#333] max-w-3xl mx-auto mb-12 leading-[1.6] font-medium px-4 pointer-events-auto">
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

          {/* Bottom Trust Badge */}
          <div className="stagger-text mt-12 text-[1.05rem] text-[#222] font-medium flex items-center gap-2 pointer-events-auto">
            Works without sign-up in development mode
            <span className="text-green-600 font-bold ml-1">✓</span>
          </div>
        </div>
      </main>

      {/* Informational Scroll Sections */}
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <Footer />
    </div>
  );
};

export default LandingPage;
