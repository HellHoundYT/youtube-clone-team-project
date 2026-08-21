interface PlaceholderPageProps {
  title: string
  description: string
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <span />
        </div>

        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  )
}

export default PlaceholderPage