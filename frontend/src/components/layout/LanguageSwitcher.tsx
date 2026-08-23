import {
  changeAppLanguage,
  getCurrentLanguage,
  supportedLanguages,
  type AppLanguage,
  useAppTranslation,
} from '../../i18n'

function LanguageSwitcher() {
  const {
    t,
  } =
    useAppTranslation()

  const currentLanguage =
    getCurrentLanguage()

  const handleChange = (
    value: string,
  ) => {
    void changeAppLanguage(
      value as AppLanguage,
    )
  }

  return (
    <div
      className="language-switcher"
      style={{
        marginRight: '8px',
      }}
    >
      <select
        className="language-select"
        aria-label={t(
          'common.language',
        )}
        title={t(
          'common.language',
        )}
        value={
          currentLanguage
        }
        onChange={(
          event,
        ) =>
          handleChange(
            event.target.value,
          )
        }
      >
        {supportedLanguages.map(
          (language) => (
            <option
              key={
                language.code
              }
              value={
                language.code
              }
            >
              {
                language.shortLabel
              }
            </option>
          ),
        )}
      </select>
    </div>
  )
}

export default LanguageSwitcher
