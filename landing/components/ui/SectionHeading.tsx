import DecryptText from "./DecryptText";

export default function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-[#e8eaed]">
        {eyebrow}
      </p>
      <DecryptText
        as="h2"
        text={title}
        className="font-display text-3xl font-bold tracking-tight text-white md:text-5xl"
      />
      {sub && <p className="mt-4 text-base leading-relaxed text-slate-400">{sub}</p>}
    </div>
  );
}
