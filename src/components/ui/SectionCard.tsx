interface SectionCardProps {
  title: string;
  description: string;
}

export function SectionCard({ title, description }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm shadow-slate-200/50">
      <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
