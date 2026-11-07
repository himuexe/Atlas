import { useEffect, useMemo, useRef, useState } from 'react';
import type { AttributeDefinition } from './domain/types';
import { useLifeContext } from './LifeContext';
import { buildLifeDimensionExplorerItems, type LifeDimensionExplorerItem } from './dimensionExplorerModel';
import { LifeAttributeControls, LifeDimensionControls } from './LifeDefinitionForms';
import type { LifeDimension } from './domain/types';
import { LifeAttributeDetail } from './LifeAttributeDetail';

const kindLabels: Record<AttributeDefinition['kind'], string> = {
  measurement: 'Measurement',
  capability: 'Capability',
  'subjective-assessment': 'Self-assessment',
};

const valueTypeLabels: Record<AttributeDefinition['valueType'], string> = {
  numeric: 'Number',
  rating: 'Rating',
  boolean: 'Yes / no',
  counter: 'Count',
  frequency: 'Frequency',
  milestone: 'Milestone',
  narrative: 'Narrative',
};

function AttributeCard({ attribute, onSelect }: { attribute: AttributeDefinition; onSelect: () => void }) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="font-semibold text-zinc-100">{attribute.name}</h5>
          <p className="mt-1.5 text-sm leading-6 text-zinc-400">
            {attribute.description?.trim() || 'No description provided.'}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            attribute.isBuiltIn
              ? 'border-purple-200/20 bg-purple-200/[0.08] text-purple-100'
              : 'border-white/10 bg-white/[0.04] text-zinc-300'
          }`}>
            {attribute.isBuiltIn ? 'Built-in' : 'Custom'}
          </span>
          {!attribute.isActive ? (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Inactive
            </span>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/[0.06] pt-3">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Attribute type</dt>
          <dd className="mt-1 text-xs text-zinc-200">{kindLabels[attribute.kind]}</dd>
        </div>
        {attribute.kind === 'measurement' ? (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Measurement format</dt>
            <dd className="mt-1 text-xs text-zinc-200">{valueTypeLabels[attribute.valueType]}</dd>
          </div>
        ) : null}
        {attribute.unit ? (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Unit</dt>
            <dd className="mt-1 text-xs text-zinc-200">{attribute.unit}</dd>
          </div>
        ) : null}
        {attribute.measurementFrequency ? (
          <div>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Suggested cadence</dt>
            <dd className="mt-1 text-xs text-zinc-200">{attribute.measurementFrequency}</dd>
          </div>
        ) : null}
      </dl>
      <button
        type="button"
        onClick={onSelect}
        className="mt-4 rounded-full border border-purple-200/15 px-3.5 py-2 text-xs font-medium text-purple-100 hover:bg-purple-200/[0.08] focus:outline-none focus:ring-2 focus:ring-purple-200/60"
      >
        Open attribute
      </button>
    </article>
  );
}

function DimensionDetail({
  dimension,
  storedDimension,
  dimensions,
  onBack,
  selectedAttributeId,
  onSelectAttribute,
  onBackFromAttribute,
  onDataChange,
}: {
  dimension: LifeDimensionExplorerItem;
  storedDimension: LifeDimension;
  dimensions: LifeDimension[];
  onBack: () => void;
  selectedAttributeId: string | null;
  onSelectAttribute: (id: string) => void;
  onBackFromAttribute: () => void;
  onDataChange: () => void;
}) {
  const selectedAttribute = dimension.attributes.find((attribute) => attribute.id === selectedAttributeId);
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-zinc-400 hover:bg-white/[0.05] hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60"
      >
        <span aria-hidden="true" className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none">←</span>
        All dimensions
      </button>
      <div className="mt-5 border-b border-white/[0.07] pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{dimension.name}</h4>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
            dimension.isBuiltIn
              ? 'border-purple-200/20 bg-purple-200/[0.08] text-purple-100'
              : 'border-white/10 bg-white/[0.04] text-zinc-300'
          }`}>
            {dimension.isBuiltIn ? 'Built-in dimension' : 'Custom dimension'}
          </span>
          {!dimension.isActive ? (
            <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Inactive
            </span>
          ) : null}
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{dimension.description}</p>
        <p className="mt-4 text-xs text-zinc-500">
          {dimension.attributes.length
            ? `${dimension.attributes.length} ${dimension.attributes.length === 1 ? 'attribute' : 'attributes'}`
            : 'No attributes configured'}
        </p>
      </div>
      {!dimension.isBuiltIn ? <LifeDimensionControls dimension={storedDimension} /> : null}
      {selectedAttribute ? (
        <LifeAttributeDetail attribute={selectedAttribute} onBack={onBackFromAttribute} onDataChange={onDataChange} />
      ) : (
        <>
          <LifeAttributeControls dimension={storedDimension} dimensions={dimensions} />
          {dimension.attributes.length ? (
            <ul className="mt-5 grid gap-3 lg:grid-cols-2">
              {dimension.attributes.map((attribute) => (
                <li key={attribute.id}>
                  <AttributeCard attribute={attribute} onSelect={() => onSelectAttribute(attribute.id)} />
                  <LifeAttributeControls attribute={attribute} dimension={storedDimension} dimensions={dimensions} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-8 text-center">
              <p className="text-sm font-medium text-zinc-200">A space to define later</p>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                There are no attributes configured for this dimension yet. It remains a useful part of your life framework without requiring a checklist.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DimensionOverview({
  dimensions,
  onSelect,
}: {
  dimensions: LifeDimensionExplorerItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <div className="grid gap-2 lg:grid-cols-2">
        {dimensions.map((dimension, index) => (
          <button
            key={dimension.id}
            type="button"
            onClick={() => onSelect(dimension.id)}
            className="group flex min-h-24 items-start gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 text-left transition-colors hover:border-purple-200/20 hover:bg-purple-200/[0.035] focus:outline-none focus:ring-2 focus:ring-purple-200/60 motion-reduce:transition-none sm:p-5"
            aria-label={`Explore ${dimension.name}, ${dimension.attributes.length} ${dimension.attributes.length === 1 ? 'attribute' : 'attributes'}`}
          >
            <span className="mt-0.5 w-7 shrink-0 text-xs tabular-nums text-purple-200/45">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-zinc-100 group-hover:text-white">{dimension.name}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
                  dimension.isBuiltIn
                    ? 'border-purple-200/15 bg-purple-200/[0.05] text-purple-100/70'
                    : 'border-white/10 text-zinc-400'
                }`}>
                    {dimension.isBuiltIn ? 'Built-in' : 'Custom'}
                  </span>
                {!dimension.isActive ? (
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Inactive
                  </span>
                ) : null}
              </span>
              <span className="mt-1.5 block text-sm leading-5 text-zinc-500">{dimension.description}</span>
              <span className="mt-2 block text-[11px] text-zinc-500">
                {dimension.attributes.some((attribute) => attribute.isActive)
                  ? `${dimension.attributes.filter((attribute) => attribute.isActive).length} active ${dimension.attributes.filter((attribute) => attribute.isActive).length === 1 ? 'attribute' : 'attributes'}${dimension.attributes.some((attribute) => !attribute.isActive) ? ` · ${dimension.attributes.filter((attribute) => !attribute.isActive).length} inactive` : ''}`
                  : dimension.attributes.length
                    ? `No active attributes · ${dimension.attributes.length} inactive`
                    : 'No attributes configured'}
              </span>
            </span>
            <span aria-hidden="true" className="mt-1 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-purple-100 motion-reduce:transition-none">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LifeDimensionExplorer({
  requestedDimension,
  onDataChange,
}: {
  requestedDimension: { id: string; requestId: number } | null;
  onDataChange: () => void;
}) {
  const { dimensions: storedDimensions, attributes } = useLifeContext();
  const dimensions = useMemo(
    () => buildLifeDimensionExplorerItems(storedDimensions, attributes),
    [storedDimensions, attributes],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousSelection = useRef({ selectedId: null as string | null, selectedAttributeId: null as string | null });
  useEffect(() => {
    if (
      previousSelection.current.selectedId !== selectedId ||
      previousSelection.current.selectedAttributeId !== selectedAttributeId
    ) {
      headingRef.current?.focus();
      previousSelection.current = { selectedId, selectedAttributeId };
    }
  }, [selectedId, selectedAttributeId]);
  useEffect(() => {
    if (requestedDimension && dimensions.some(({ id }) => id === requestedDimension.id)) {
      setSelectedAttributeId(null);
      setSelectedId(requestedDimension.id);
    }
  }, [dimensions, requestedDimension]);
  const selectedDimension = dimensions.find((dimension) => dimension.id === selectedId);
  const selectedStoredDimension = storedDimensions.find((dimension) => dimension.id === selectedId);
  const selectedAttribute = selectedDimension?.attributes.find(({ id }) => id === selectedAttributeId);
  const hasSelection = Boolean(selectedDimension && selectedStoredDimension);

  return (
    <section
      id="life-dimensions"
      aria-labelledby="life-dimensions-heading"
      className="surface overflow-hidden rounded-[26px] border border-purple-300/10 bg-[#09070f]/85 p-5 shadow-[0_20px_80px_rgba(27,10,47,0.18)] sm:p-7"
    >
      <div className="mb-6 border-b border-white/[0.07] pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-purple-200/65">Life framework</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
          <h3
            ref={headingRef}
            id="life-dimensions-heading"
            tabIndex={-1}
            className="rounded-sm text-xl font-semibold tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-purple-200/60 sm:text-2xl"
          >
            {selectedAttribute
              ? `Explore ${selectedAttribute.name}`
              : selectedDimension && selectedStoredDimension
                ? `Explore ${selectedDimension.name}`
                : 'A framework for a whole life'}
          </h3>
          {!hasSelection ? (
            <span className="text-xs text-zinc-500">{dimensions.length} dimensions</span>
          ) : null}
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          {hasSelection
            ? 'Explore the attributes associated with this area. They are ways to describe it, not measures of your worth.'
            : 'Life is interconnected. Browse the framework at your own pace; each dimension offers a different lens, not a score to optimize.'}
        </p>
        {!hasSelection ? <LifeDimensionControls /> : null}
      </div>
      {selectedDimension && selectedStoredDimension ? (
        <DimensionDetail
          dimension={selectedDimension}
          storedDimension={selectedStoredDimension}
          dimensions={storedDimensions}
          onBack={() => { setSelectedId(null); setSelectedAttributeId(null); }}
          selectedAttributeId={selectedAttributeId}
          onSelectAttribute={setSelectedAttributeId}
          onBackFromAttribute={() => setSelectedAttributeId(null)}
          onDataChange={onDataChange}
        />
      ) : (
        <DimensionOverview dimensions={dimensions} onSelect={(id) => { setSelectedAttributeId(null); setSelectedId(id); }} />
      )}
    </section>
  );
}
