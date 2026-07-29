interface SectionCardProps {
  title: string;
  description: string;
}

export function SectionCard({ title, description }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-sm shadow-black/20">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </section>
  );
}
