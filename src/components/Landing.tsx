import { motion } from "motion/react";
import { ArrowRight, Leaf, Route as RouteIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#05090d] text-white">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover object-[62%_center] md:object-center"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      >
        <source src="/videos/aether-city.mp4" type="video/mp4" />
      </video>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(2,7,11,0.94)_0%,rgba(2,7,11,0.78)_48%,rgba(2,7,11,0.28)_100%),linear-gradient(0deg,rgba(2,7,11,0.58)_0%,transparent_55%)]" />

      <section className="relative z-[5] flex min-h-screen items-center px-6 py-16 sm:px-8 md:px-[6vw]">
        <div className="w-full max-w-[760px]">
          <motion.p
            className="mb-5 flex items-center gap-3 text-[9px] tracking-[0.28em] text-cyan-200 before:block before:h-px before:w-8 before:bg-cyan-300 before:content-[''] sm:text-[10px] md:mb-7 md:gap-4 md:text-[11px] md:tracking-[0.32em] md:before:w-12"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            LIVE ENVIRONMENT &amp; MOBILITY
          </motion.p>

          <motion.h1
            className="m-0 max-w-[760px] text-[clamp(43px,12vw,66px)] font-light leading-[0.94] tracking-[-0.045em] sm:text-[68px] md:text-[clamp(68px,7.2vw,104px)]"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            UNDERSTAND PLACES.
            <br />
            PLAN BETTER JOURNEYS.
          </motion.h1>

          <motion.p
            className="mt-6 max-w-[590px] text-[13px] font-light leading-7 text-white/70 sm:text-[14px] md:mt-8 md:text-[15px]"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            AETHER brings live environmental conditions and intelligent route
            planning together in one interactive experience for real locations
            across India.
          </motion.p>

          <motion.div
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <button
              type="button"
              onClick={() => navigate("/explore")}
              className="group flex h-[56px] w-full items-center justify-between rounded-full border border-cyan-300/80 bg-gradient-to-r from-[#0878c8]/85 to-[#18aeea]/90 px-6 text-[10px] font-medium tracking-[0.22em] shadow-[0_0_25px_rgba(34,169,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_0_34px_rgba(34,169,255,0.38)] sm:w-[238px] md:h-[62px]"
            >
              EXPLORE AETHER
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>

            <button
              type="button"
              onClick={() => navigate("/systems/mobility")}
              className="flex h-[56px] w-full items-center justify-center gap-3 rounded-full border border-white/25 bg-black/20 px-6 text-[10px] font-medium tracking-[0.22em] text-white/90 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-cyan-200/70 hover:bg-cyan-300/10 sm:w-[220px] md:h-[62px]"
            >
              <RouteIcon className="h-4 w-4 text-cyan-200" />
              PLAN A JOURNEY
            </button>
          </motion.div>

          <motion.div
            className="mt-10 grid max-w-[570px] grid-cols-1 gap-3 text-left sm:grid-cols-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.95 }}
          >
            <div className="flex items-center gap-3 border-l border-emerald-300/40 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <Leaf className="h-4 w-4 text-emerald-300" />
              <span className="text-[9px] tracking-[0.17em] text-white/65">LIVE ENVIRONMENT</span>
            </div>
            <div className="flex items-center gap-3 border-l border-cyan-300/40 bg-black/20 px-4 py-3 backdrop-blur-sm">
              <RouteIcon className="h-4 w-4 text-cyan-200" />
              <span className="text-[9px] tracking-[0.17em] text-white/65">SMART MOBILITY</span>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

export default Landing;
