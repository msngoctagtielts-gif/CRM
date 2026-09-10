export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="mnee-rule text-xl font-semibold text-navy-900 sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-2.5 text-[0.8125rem] text-navy-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
