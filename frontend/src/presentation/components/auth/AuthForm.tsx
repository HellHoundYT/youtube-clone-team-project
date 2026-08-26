import type {
  FormHTMLAttributes,
} from 'react'

function AuthForm({
  children,
  ...formProps
}: FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      {...formProps}
      className="account-form"
    >
      {children}
    </form>
  )
}

export default AuthForm
