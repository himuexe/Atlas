interface SectionCardProps {
  title: string;
  description: string;
}

export function SectionCard({ title, description }: SectionCardProps) {
  return (
    <section className="surface rounded-2xl p-5">
      <h3 className="text-base font-semibold tracking-[-0.025em] text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
    </section>
  );
}
