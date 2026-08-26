import type {
  ButtonHTMLAttributes,
} from 'react'

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean
  loadingLabel: string
}

function AuthSubmitButton({
  children,
  isLoading,
  loadingLabel,
  ...buttonProps
}: AuthSubmitButtonProps) {
  return (
    <button
      {...buttonProps}
      className="account-primary"
      type="submit"
      disabled={isLoading || buttonProps.disabled}
    >
      {isLoading
        ? loadingLabel
        : children}
    </button>
  )
}

export default AuthSubmitButton
