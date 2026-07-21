import { motion } from "motion/react";
import { Github } from "lucide-react";

type Props = {
  onClick?: () => void;
  href?: string;
  label?: string;
};

export function LiquidGithubButton({ onClick, href, label = "GitHub" }: Props) {
  const inner = (
    <motion.span
      className="relative z-10 inline-flex items-center gap-2 font-semibold"
      whileHover={{ y: -1 }}
    >
      <Github className="h-4 w-4" />
      {label}
    </motion.span>
  );

  const cls =
    "group relative inline-flex items-center overflow-hidden rounded-full border border-white/10 bg-black/70 px-5 py-2.5 text-sm text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.6)] transition hover:border-white/30";

  const blobs = (
    <>
      <motion.span
        aria-hidden
        className="absolute -left-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-600 to-indigo-500 blur-2xl opacity-70"
        animate={{ x: [0, 40, 0], y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="absolute -right-6 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 blur-2xl opacity-70"
        animate={{ x: [0, -30, 0], y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="absolute inset-0 -z-0 rounded-full bg-black/60 backdrop-blur-md" />
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} onClick={onClick}>
        {blobs}
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {blobs}
      {inner}
    </button>
  );
}
