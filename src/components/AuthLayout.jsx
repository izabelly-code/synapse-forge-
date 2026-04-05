function AuthLayout({ children }) {
    return (
        <div className="auth-container">
            <div className="auth-left">
                <h1>Synapse Forge</h1>
            </div>

            <div className="auth-right">
                {children}
            </div>
        </div>
    );
}

export default AuthLayout;