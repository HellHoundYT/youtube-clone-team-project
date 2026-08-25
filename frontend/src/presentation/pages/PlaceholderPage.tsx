import {
  useAppTranslation,
} from '../../shared/i18n'

interface PlaceholderPageProps {
  titleKey: string
  descriptionKey: string
}

function PlaceholderPage({
  titleKey,
  descriptionKey,
}: PlaceholderPageProps) {
  const {
    t,
  } =
    useAppTranslation()

  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <div className="placeholder-icon">
          <span />
        </div>

        <h1>
          {t(
            titleKey,
          )}
        </h1>

        <p>
          {t(
            descriptionKey,
          )}
        </p>
      </div>
    </div>
  )
}

export default PlaceholderPage
