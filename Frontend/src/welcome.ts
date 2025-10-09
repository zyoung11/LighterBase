import auth from "./apis/auth";

const tabLogin = document.getElementById("tab-login") as HTMLButtonElement;
const tabReg = document.getElementById("tab-reg") as HTMLButtonElement;
const formLogin = document.getElementById("form-login") as HTMLFormElement;
const formReg = document.getElementById("form-reg") as HTMLFormElement;

function toggleForm(isLogin = true) {
  if (isLogin) {
    tabLogin.classList.add("bg-[#2B2F31]", "text-white");
    tabLogin.classList.remove("bg-transparent", "hover:bg-[#2B2F31]/50");
    tabReg.classList.remove("bg-[#2B2F31]", "text-white");
    tabReg.classList.add("bg-transparent", "hover:bg-[#2B2F31]/50");
    formLogin.classList.remove("hidden");
    formReg.classList.add("hidden");
  } else {
    tabReg.classList.add("bg-[#2B2F31]", "text-white");
    tabReg.classList.remove("bg-transparent", "hover:bg-[#2B2F31]/50");
    tabLogin.classList.remove("bg-[#2B2F31]", "text-white");
    tabLogin.classList.add("bg-transparent", "hover:bg-[#2B2F31]/50");
    formReg.classList.remove("hidden");
    formLogin.classList.add("hidden");
  }
}

tabLogin.addEventListener("click", () => toggleForm(true));
tabReg.addEventListener("click", () => toggleForm(false));


formLogin.addEventListener("submit", async(e) => {
  e.preventDefault();
  await auth.userLogin();
  // window.location.href = "/";
});


formReg.addEventListener("submit", async(e) => {
  e.preventDefault();
  await auth.userRegister();
  
});



