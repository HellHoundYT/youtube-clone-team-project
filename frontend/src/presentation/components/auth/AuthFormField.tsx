import type {
  InputHTMLAttributes,
} from 'react'

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

function AuthFormField({
  label,
  ...inputProps
}: AuthFormFieldProps) {
  return (
    <label>
      {label}
      <input {...inputProps} />
    </label>
  )
}

export default AuthFormField
