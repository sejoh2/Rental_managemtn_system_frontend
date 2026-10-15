import { EmptyState } from '../common/DataState'
import { useProperties } from '../../context/PropertiesContext'

// Shown by pages about one property while "All properties" is chosen in the top bar.
function ChooseProperty({ message }) {
  const { data, selectProperty } = useProperties()

  return (
    <section className="rounded-[10px] border border-[var(--line)] bg-[var(--surface)]">
      <EmptyState title="Choose a property" message={message}>
        <div className="mt-2 flex flex-wrap justify-center gap-[10px]">
          {(data || []).map((property) => (
            <button
              key={property.id}
              type="button"
              onClick={() => selectProperty(property.id)}
              className="rounded-[8px] border border-[var(--line)] bg-[var(--surface)] px-4 py-[10px] text-[12px] font-bold hover:border-[var(--accent)] hover:text-[var(--accent-ink)]"
            >
              {property.name}
            </button>
          ))}
        </div>
      </EmptyState>
    </section>
  )
}

export default ChooseProperty
