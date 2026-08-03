interface SectionCardProps {
  title: string;
  description: string;
}

export function SectionCard({ title, description }: SectionCardProps) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#060606]/90 p-5 sm:p-6">
      <h3 className="text-lg font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
    </section>
  );
}
