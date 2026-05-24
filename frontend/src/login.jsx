import { useState } from "react";   
import "./login.css";

const SSOButtons = () => (
    <div className="SSO">
        <a className="fa-brands fa-facebook" />
        <a className="fa-brands fa-twitter" />
        <a className="fa-brands fa-linkedin" />
    </div>
);

const Hero = ({ type, active, title, text, buttonText, onClick }) => (
    <div className={`hero ${type} ${active ? "active" : ""}`}>
        <h2>{title}</h2>
        <p>{text}</p>
        <button type="button" onClick={onClick}>{buttonText}</button>
    </div>
);

const AuthForm = ({ type, active, title, children }) => (
    <div className={`form ${type} ${active ? "active" : ""}`}>
        <h2>{title}</h2>
        <SSOButtons />
        <p>Or use your email address</p>
        <form>{children}</form>
    </div>
);

export const Login = () => {
    const [view, setView] = useState("signup");
    const isSignup = view === "signup";
    
    // Fixed the broken ternary state logic here
    const toggleView = () => setView(isSignup ? "signin" : "signup");

    return (
        <div className="card">
            <div
                className="card-log"
                style={{ translate: isSignup ? 0 : "100%" }} 
            />
            
            <Hero
                type="signup"
                active={isSignup}
                title="Welcome Back!"
                text="Sign in to view and add property"
                buttonText="SIGN IN"
                onClick={toggleView}
            />
            
            <AuthForm type="signup" active={isSignup} title="Create Account">
                <input type="text" placeholder="Username" />
                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />
                <button type="submit">SIGN UP</button>
            </AuthForm>

            <Hero
                type="signin"
                active={!isSignup}
                title="Hey there!"
                text="Start your journey here and begin buying and selling"
                buttonText="SIGN UP"
                onClick={toggleView}
            />
            
            <AuthForm type="signin" active={!isSignup} title="Sign in">
                <input type="text" placeholder="Email/Username" />
                <input type="password" placeholder="Password" />
                <a href="#forgot">Forgot password?</a>
                <button type="submit">SIGN IN</button>
            </AuthForm>
        </div>
    );
};
