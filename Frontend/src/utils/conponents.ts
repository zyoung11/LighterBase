const rightSlidebar = document.getElementById("right-slidebar") as HTMLElement;
const slidebarTitle = document.getElementById("slidebar-title") as HTMLElement;
const slidebarContent = document.getElementById("slidebar-content") as HTMLElement;

// function hideRightSlidebar() {
//   rightSlidebar.classList.add("translate-x-full");
// }

// function showRightSlidebar(title:string, content:string) {
//   slidebarTitle.textContent = title;
//   slidebarContent.innerHTML = content;
//   rightSlidebar.classList.remove("translate-x-full");
// };

const conponents = {
//   rightSlidebar: document.getElementById("right-slidebar") as HTMLElement,
//   slidebarTitle: document.getElementById("slidebar-title") as HTMLElement,
//   slidebarContent: document.getElementById("slidebar-content") as HTMLElement,

  hideRightSlidebar() {
    rightSlidebar.classList.add("translate-x-full");
  },
  
  showRightSlidebar(title:string, content:string) {
    slidebarTitle.textContent = title;
    slidebarContent.innerHTML = content;
    rightSlidebar.classList.remove("translate-x-full");
  }
};

export default conponents;