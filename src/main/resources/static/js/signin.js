// signin.js – Password show/hide toggle (works on login + register)
document.addEventListener("DOMContentLoaded", function () {
    // Find all eyeball toggles on the page
    document.querySelectorAll(".toggle-password").forEach(toggle => {
        toggle.addEventListener("click", function () {
            // Find the password input that belongs to this toggle
            // Works whether it's a sibling, inside a wrapper, etc.
            const passwordInput = this.closest("div").querySelector('input[type="password"], input[type="text"]');
            const icon = this.querySelector("i");

            if (!passwordInput || !icon) return;

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            }
        });
    });
});