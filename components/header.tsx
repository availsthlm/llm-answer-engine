export function Header() {
  return (
    <header className="sticky z-50 flex justify-around w-full px-4 py-4 shrink-0  backdrop-blur-xl">
      <a
        href="https://availsthlm.se"
        rel="noopener"
        target="_blank"
        className="Header__logo"
      >
        <img src={"/logga.jpg"} alt="Chef GPT logo" width="320" />
      </a>
    </header>
  );
}
