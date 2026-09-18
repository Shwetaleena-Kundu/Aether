import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Leaf, Route as RouteIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

type ToolCardProps = {
  name: string;
  description: string;
  detail: string;
  color: string;
  icon: "environment" | "mobility";
  delay: number;
  onClick: () => void;
};

function CityExplorer() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#03080c] text-white">
      <motion.img
        src="/images/aether-city-explorer.png"
        alt="Aerial city view behind the AETHER tool selector"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] lg:object-center"
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,7,11,0.96)_0%,rgba(2,7,11,0.85)_42%,rgba(2,7,11,0.48)_100%),linear-gradient(0deg,rgba(2,7,11,0.72)_0%,transparent_55%)]" />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8 md:px-[6vw] md:py-7">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[9px] tracking-[0.2em] text-white/55 transition hover:text-cyan-200"
        >
          <ArrowLeft className="h-4 w-4" /> HOME
        </button>
        <p className="text-[10px] tracking-[0.3em] text-cyan-200">AETHER</p>
      </header>

      <section className="relative z-[5] mx-auto flex min-h-[calc(100vh-76px)] w-[88%] max-w-[1180px] flex-col justify-center py-12">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-5 flex items-center gap-3 text-[9px] tracking-[0.3em] text-cyan-200 before:block before:h-px before:w-8 before:bg-cyan-300 before:content-['']">
            CHOOSE A TOOL
          </p>
          <h1 className="max-w-[740px] text-[clamp(42px,10vw,64px)] font-light leading-[0.96] tracking-[-0.04em] md:text-[clamp(58px,6vw,88px)]">
            ONE PLATFORM.
            <br />
            TWO CLEAR PURPOSES.
          </h1>
          <p className="mt-6 max-w-[570px] text-[13px] leading-7 text-white/60 sm:text-[14px]">
            Check current environmental conditions for a real location, or plan
            a journey with route, traffic and road insights.
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
          <ToolCard
            name="ENVIRONMENT EXPLORER"
            description="UNDERSTAND A LOCATION"
            detail="Explore live weather, air quality, humidity, wind, rainfall and a 24-hour temperature trend."
            color="#5cf2a5"
            icon="environment"
            delay={0.25}
            onClick={() => navigate("/systems/environment")}
          />
          <ToolCard
            name="MOBILITY PLANNER"
            description="PLAN A BETTER JOURNEY"
            detail="Compare driving, cycling and walking routes with distance, duration, traffic and incident insights."
            color="#61ddff"
            icon="mobility"
            delay={0.4}
            onClick={() => navigate("/systems/mobility")}
          />
        </div>
      </section>
    </main>
  );
}

function ToolCard({ name, description, detail, color, icon, delay, onClick }: ToolCardProps) {
  const Icon = icon === "environment" ? Leaf : RouteIcon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="group relative min-h-[220px] overflow-hidden border border-white/10 bg-black/40 p-6 text-left backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:bg-black/55 sm:p-8"
      style={{ boxShadow: `inset 3px 0 0 ${color}88` }}
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full border"
        style={{ color, borderColor: `${color}66`, boxShadow: `0 0 24px ${color}25` }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-7 text-[9px] tracking-[0.2em] text-white/45">{description}</p>
      <h2 className="mt-2 text-xl font-light tracking-[0.08em]" style={{ color }}>
        {name}
      </h2>
      <p className="mt-4 max-w-[470px] text-[12px] leading-6 text-white/55">{detail}</p>
      <span className="mt-6 flex items-center gap-2 text-[9px] tracking-[0.2em] text-white/65 transition group-hover:text-white">
        OPEN TOOL <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </motion.button>
  );
}

export default CityExplorer;
