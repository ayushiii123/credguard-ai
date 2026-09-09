import { useState } from "react";
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const initialValues = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

const validate = (values) => {
	const errors = {};

	if (!values.name.trim()) errors.name = "Enter your full name.";
	if (!values.email.trim()) {
		errors.email = "Enter your email address.";
	} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
		errors.email = "Enter a valid email address.";
	}
	if (!values.password) {
		errors.password = "Create a password.";
	} else if (values.password.length < 8) {
		errors.password = "Use at least 8 characters.";
	}
	if (!values.confirmPassword) {
		errors.confirmPassword = "Confirm your password.";
	} else if (values.password !== values.confirmPassword) {
		errors.confirmPassword = "Passwords do not match.";
	}

	return errors;
};

function Field({ id, label, icon: Icon, error, ...props }) {
	return (
		<div>
			<label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-200">
				{label}
			</label>
			<div className="relative">
				<Icon aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
				<input
					id={id}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? `${id}-error` : undefined}
					className={`w-full rounded-xl border bg-slate-950/60 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
						error
							? "border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/10"
							: "border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/10"
					}`}
					{...props}
				/>
			</div>
			{error && (
				<p id={`${id}-error`} className="mt-1.5 text-xs text-rose-300">
					{error}
				</p>
			)}
		</div>
	);
}

function PasswordField({ id, name, label, value, onChange, error, showPassword, onToggle }) {
	return (
		<div>
			<label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-200">
				{label}
			</label>
			<div className="relative">
				<FiLock aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
				<input
					id={id}
					  name={name}
					type={showPassword ? "text" : "password"}
					value={value}
					onChange={onChange}
					aria-invalid={Boolean(error)}
					aria-describedby={error ? `${id}-error` : undefined}
					placeholder={label === "Password" ? "At least 8 characters" : "Re-enter your password"}
					className={`w-full rounded-xl border bg-slate-950/60 py-3.5 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:ring-2 ${
						error
							? "border-rose-500/70 focus:border-rose-400 focus:ring-rose-500/10"
							: "border-slate-700/80 focus:border-cyan-400 focus:ring-cyan-400/10"
					}`}
				/>
				<button
					type="button"
					onClick={onToggle}
					aria-label={showPassword ? "Hide password" : "Show password"}
					className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
				>
					{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
				</button>
			</div>
			{error && (
				<p id={`${id}-error`} className="mt-1.5 text-xs text-rose-300">
					{error}
				</p>
			)}
		</div>
	);
}

function Register() {
	const navigate = useNavigate();
	const { register } = useAuth();
	const [values, setValues] = useState(initialValues);
	const [errors, setErrors] = useState({});
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const updateValue = (event) => {
		const { name, value } = event.target;
		setValues((current) => ({ ...current, [name]: value }));
		setErrors((current) => ({ ...current, [name]: undefined }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		const validationErrors = validate(values);

		if (Object.keys(validationErrors).length) {
			setErrors(validationErrors);
			return;
		}

		setIsSubmitting(true);
		try {
			await register(values.name.trim(), values.email.trim(), values.password);
			toast.success("Account created. You can now sign in.");
			navigate("/login", { replace: true });
		} catch (error) {
			toast.error(error.message || "Registration failed. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050b18] px-4 py-10 text-white sm:px-6">
			<div className="pointer-events-none absolute -left-32 top-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl" />
			<div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

			<section className="relative w-full max-w-lg">
				<div className="mb-8 text-center">
					<Link to="/login" className="mb-5 inline-flex items-center gap-3 text-left">
						<span className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]">
							<FiLock aria-hidden="true" size={20} />
						</span>
						<span>
							<span className="block text-lg font-semibold tracking-tight">CredGuard <span className="text-cyan-300">AI</span></span>
							<span className="block text-xs text-slate-500">Credential intelligence platform</span>
						</span>
					</Link>
					<p className="mx-auto max-w-sm text-sm leading-6 text-slate-400">
						Protect your digital identity before it becomes a risk.
					</p>
				</div>

				<div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
					<div className="mb-7">
						<p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Get started</p>
						<h1 className="text-2xl font-semibold tracking-tight text-white">Create your account</h1>
						<p className="mt-2 text-sm text-slate-400">Start monitoring your digital exposure in minutes.</p>
					</div>

					<form onSubmit={handleSubmit} noValidate className="space-y-5">
						<Field id="name" name="name" label="Full Name" icon={FiUser} value={values.name} onChange={updateValue} error={errors.name} autoComplete="name" placeholder="Alex Morgan" />
						<Field id="email" name="email" label="Email Address" icon={FiMail} value={values.email} onChange={updateValue} error={errors.email} autoComplete="email" placeholder="you@example.com" type="email" />
						<PasswordField id="password" name="password" label="Password" value={values.password} onChange={updateValue} error={errors.password} showPassword={showPassword} onToggle={() => setShowPassword((visible) => !visible)} />
						<PasswordField id="confirmPassword" name="confirmPassword" label="Confirm Password" value={values.confirmPassword} onChange={updateValue} error={errors.confirmPassword} showPassword={showConfirmPassword} onToggle={() => setShowConfirmPassword((visible) => !visible)} />

						<button
							type="submit"
							disabled={isSubmitting}
							className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isSubmitting ? "Creating account..." : "Create Account"}
							{!isSubmitting && <FiArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />}
						</button>
					</form>

					<p className="mt-7 text-center text-sm text-slate-400">
						Already have an account?{" "}
						<Link to="/login" className="font-medium text-cyan-300 transition hover:text-cyan-200 hover:underline">
							Login
						</Link>
					</p>
				</div>

				<p className="mt-6 text-center text-xs text-slate-600">Your credentials are encrypted and never stored in this browser.</p>
			</section>
		</main>
	);
}

export default Register;
