import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import backgroundImage from '../assets/Image/can-tin-so.png'
import logoImage from '../assets/Image/logo5.jpg'
import { LOGIN_TOAST_KEY } from '../datas/loginData'
import { useAuth } from '../auth/authContext'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [role, setRole] = useState('KITCHEN')
  const [busy, setBusy] = useState(false)
  const [formValue, setFormValue] = useState({
    email: '',
    password: '',
  })
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormValue((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
    setErrorMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if(busy) return
    setBusy(true);setErrorMessage('')
    try { await login(formValue.email,formValue.password,role); sessionStorage.setItem(LOGIN_TOAST_KEY,'Đăng nhập thành công');navigate('/dashboard') }
    catch(error) { setErrorMessage(error.message) }
    finally {setBusy(false)}
  }

  return (
    <main
      className="relative grid min-h-screen place-items-center bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-white/20" aria-hidden="true" />

      <section className="relative w-full max-w-md rounded-xl bg-white px-8 py-9 shadow-2xl shadow-slate-900/20 sm:px-10">
        <div className="flex flex-col items-center">
          <img
            className="size-20 rounded-full object-cover shadow-md shadow-slate-900/10"
            src={logoImage}
            alt="KIDO Edu"
          />
          <h1 className="mt-5 text-center text-xl font-bold tracking-normal text-slate-950">
            Đăng nhập hệ thống nhân viên bếp
          </h1>
        </div>

        <form className="mt-9 space-y-6" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm text-slate-700">Vai trò đăng nhập<select className="rounded border p-2" value={role} onChange={e=>setRole(e.target.value)}><option value="KITCHEN">Nhân viên bếp</option><option value="MANAGER">Quản lý / Quản trị</option></select></label>
          <div>
            <div className="flex items-center justify-center gap-2 border-b-2 border-blue-600 pb-2 text-sm font-semibold text-blue-600">
              <UserRound size={17} aria-hidden="true" />
              Tài khoản
            </div>
          </div>

          <label className="flex items-center gap-3 border-b border-slate-300 pb-3 text-slate-500 focus-within:border-blue-600 focus-within:text-blue-600">
            <Mail size={19} aria-hidden="true" />
            <span className="sr-only">Email nhân viên</span>
            <input
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              name="email"
              onChange={handleChange}
              placeholder="Email nhân viên"
              required
              type="email"
              value={formValue.email}
            />
          </label>

          <label className="flex items-center gap-3 border-b border-slate-300 pb-3 text-slate-500 focus-within:border-blue-600 focus-within:text-blue-600">
            <LockKeyhole size={19} aria-hidden="true" />
            <span className="sr-only">Mật khẩu</span>
            <input
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              name="password"
              onChange={handleChange}
              placeholder="Mật khẩu"
              required
              type={showPassword ? 'text' : 'password'}
              value={formValue.password}
            />
            <button
              className="text-slate-500 transition hover:text-blue-600"
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </label>

          <div className="flex justify-end">
            <a
              className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              href="#forgot-password"
            >
              Quên mật khẩu?
            </a>
          </div>

          {errorMessage ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-600">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            disabled={busy}
            type="submit"
          >
            Đăng nhập
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
